import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';
import {
  keccak256,
  serializeTransaction,
  type Hex,
  type TransactionSerializable
} from 'viem';
import {
  hashAuthorization,
  recoverAuthorizationAddress,
  verifyAuthorization,
  type Authorization
} from 'viem/experimental';

export interface NFCCardData {
  address: `0x${string}`;
  publicKey: string;
}

interface HaloSignCommand {
  name: 'sign';
  keyNo: number;
  rpId: string;
  digest?: string;
  message?: string | Hex;
  format?: 'text' | 'hex';
}

// Helper function to get valid RP ID for WebAuthn
const getRpId = () => {
  const hostname = window.location.hostname;
  // WebAuthn doesn't support IP addresses as RP ID
  // Check if hostname is an IP address (IPv4 or IPv6)
  const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$|^\[?[0-9a-fA-F:]+\]?$/.test(hostname);
  
  if (isIPAddress) {
    throw new Error(
      `Cannot use NFC with IP address (${hostname}). ` +
      `Use ngrok for mobile testing: npx ngrok http 3001`
    );
  }
  
  return hostname;
};

export const getCardData = async (): Promise<NFCCardData> => {
  console.log('📱 NFC: Starting getCardData...');
  console.log('📱 NFC: Platform:', {
    userAgent: navigator.userAgent,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
  });

  try {
    // Note: This requires either:
    // 1. HaLo Bridge running on desktop (with USB NFC reader)
    // 2. Android Chrome with NFC enabled
    // Will fail on desktop browsers without HaLo Bridge
    const rpId = getRpId();
    console.log('📱 NFC: Using rpId:', rpId);

    console.log('📱 NFC: Calling execHaloCmdWeb with get_pkeys...');
    const result = await execHaloCmdWeb({
      name: 'get_pkeys',
      rpId: rpId
    });
    console.log('📱 NFC: get_pkeys result:', result);
    
    const address = result.etherAddresses?.['1'] as `0x${string}`;
    const publicKey = result.publicKeys?.['1'];

    if (!address || !publicKey) {
      console.error('📱 NFC: Missing data in result:', {
        hasAddress: !!address,
        hasPublicKey: !!publicKey,
        etherAddresses: result.etherAddresses,
        publicKeys: result.publicKeys
      });
      throw new Error('Failed to extract card data');
    }

    console.log('📱 NFC: Card data retrieved successfully:', {
      address,
      publicKeyLength: publicKey.length
    });

    return { address, publicKey };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('📱 NFC: Failed to get card data:', {
      message: errorObj.message,
      name: errorObj.name,
      stack: errorObj.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Check for common errors
    if (errorObj.message?.includes('NotAllowedError') || errorObj.message?.includes("device can't be used")) {
      throw new Error(
        'NFC reader not available. Desktop users: Install HaLo Bridge with USB NFC reader. ' +
        'Mobile users: Use Android Chrome with NFC enabled.'
      );
    }

    throw new Error('Failed to read NFC card. Please ensure NFC is enabled and try again.');
  }
};

export const signWithNFC = async (message: string | Hex, isRawDigest: boolean = false): Promise<Hex> => {
  try {
    const command: HaloSignCommand = {
      name: 'sign',
      keyNo: 1,
      rpId: getRpId()
    };

    if (isRawDigest) {
      // For raw digests (like transaction hashes), use digest parameter
      // Ensure digest is properly formatted as hex string
      let digestHex = typeof message === 'string' ? message : message;
      // Remove 0x prefix if present for libhalo
      if (digestHex.startsWith('0x')) {
        digestHex = digestHex.slice(2);
      }
      // Validate it's exactly 32 bytes (64 hex chars)
      if (digestHex.length !== 64) {
        throw new Error(`Digest must be exactly 32 bytes (64 hex chars), got ${digestHex.length} chars`);
      }
      command.digest = digestHex;
    } else if (typeof message === 'string' && !message.startsWith('0x')) {
      // For text messages, use message with text format
      // libhalo will add Ethereum prefix and hash it
      command.message = message;
      command.format = 'text';
    } else {
      // For hex messages, use message with hex format (default)
      command.message = message;
      command.format = 'hex';
    }

    console.log('📱 NFC: Sign Command:', command);
    console.log('📱 NFC: Executing sign command...');
    const startTime = Date.now();
    const result = await execHaloCmdWeb(command);
    const elapsed = Date.now() - startTime;
    console.log(`📱 NFC: Sign completed in ${elapsed}ms, result:`, result);
    console.log('NFC Sign Result:', result);

    if (!result.signature) {
      throw new Error(`No signature returned from card. Result: ${JSON.stringify(result)}`);
    }

    return result.signature.ether as Hex;
  } catch (error) {
    console.error('NFC signing failed - Full Error:', error);

    const errorObj = error instanceof Error ? error : new Error(String(error));
    // Create detailed error message
    const errorDetails = {
      message: errorObj.message || 'Unknown error',
      type: errorObj.name || 'Error',
      stack: errorObj.stack?.split('\n').slice(0, 3).join(' | '),
      command: isRawDigest ? 'digest' : 'message',
      rpId: window.location.hostname
    };

    throw new Error(`NFC Sign Failed:\nType: ${errorDetails.type}\nMessage: ${errorDetails.message}\nCommand: ${errorDetails.command}\nRpId: ${errorDetails.rpId}`);
  }
};

export const createNFCAccount = (address: `0x${string}`) => {
  return {
    type: 'local' as const,
    address,
    signMessage: async ({ message }: { message: string | { raw: Hex } }) => {
      // Check if this is an EIP-7702 authorization message
      // EIP-7702 messages start with 0x05 magic byte
      let isEIP7702 = false;
      let messageToSign;

      if (typeof message === 'object' && 'raw' in message) {
        const rawHex = message.raw;
        // Check if this looks like an EIP-7702 message (starts with 0x05)
        if (rawHex.length > 4 && rawHex.slice(0, 4) === '0x05') {
          console.log('📱 NFC: Detected EIP-7702 authorization message');
          isEIP7702 = true;
          // For EIP-7702, we need to hash the message and sign the raw digest
          const digest = keccak256(message.raw);
          console.log('📱 NFC: EIP-7702 digest to sign:', digest);
          messageToSign = digest;
        } else {
          messageToSign = message.raw;
        }
      } else {
        // String message
        messageToSign = message;
      }

      // Sign with NFC - use raw digest mode for EIP-7702
      const signature = await signWithNFC(messageToSign, isEIP7702);
      return signature;
    },
    signTransaction: async (transaction: TransactionSerializable) => {
      console.log('NFC signTransaction called with:', {
        to: transaction.to,
        from: address,
        value: transaction.value?.toString(),
        data: typeof transaction.data === 'string' ? transaction.data.slice(0, 10) + '...' : transaction.data,
        nonce: transaction.nonce,
        gas: transaction.gas?.toString(),
        chainId: transaction.chainId
      });

      const serialized = serializeTransaction(transaction);
      console.log('📱 NFC: Serialized transaction:', serialized);

      const hash = keccak256(serialized);
      console.log('📱 NFC: Transaction hash to sign:', hash);

      // Pass true for isRawDigest since this is a transaction hash
      const signature = await signWithNFC(hash, true);
      console.log('📱 NFC: Transaction signature received:', signature);

      // Parse signature components
      const r = `0x${signature.slice(2, 66)}` as Hex;
      const s = `0x${signature.slice(66, 130)}` as Hex;
      const v = parseInt(signature.slice(130, 132), 16);
      const yParity = v === 27 ? 0 : 1;

      // Serialize the signed transaction
      const signedTx = serializeTransaction(transaction, {
        r,
        s,
        yParity
      });

      console.log('📱 NFC: Signed transaction:', signedTx);
      return signedTx;
    },
    signTypedData: async () => {
      throw new Error('Typed data signing not yet implemented');
    },
    signAuthorization: async (authorization: Authorization) => {
      console.log('📱 NFC: signAuthorization called with:', authorization);

      // Use viem's hashAuthorization to get the proper hash
      const hash = hashAuthorization(authorization);
      console.log('📱 NFC: Authorization hash from viem:', hash);

      // Sign the raw digest with NFC
      const signature = await signWithNFC(hash, true);
      console.log('📱 NFC: Authorization signature:', signature);

      // Parse signature components
      const r = `0x${signature.slice(2, 66)}` as Hex;
      const s = `0x${signature.slice(66, 130)}` as Hex;
      const v = parseInt(signature.slice(130, 132), 16);
      const yParity = v === 27 ? 0 : 1;

      // Return the signed authorization with all required fields
      const result = {
        ...authorization,
        r,
        s,
        yParity,
        v: BigInt(v)
      };

      console.log('📱 NFC: Signed authorization:', result);

      // Verify the signature and recover the address
      try {
        const recoveredAddress = await recoverAuthorizationAddress({
          authorization: result
        });
        console.log('📱 NFC: Recovered address from authorization:', recoveredAddress);
        console.log('📱 NFC: Expected address (EOA):', address);
        console.log('📱 NFC: Address match:', recoveredAddress.toLowerCase() === address.toLowerCase());

        const isValid = await verifyAuthorization({
          authorization: result,
          address: address
        });
        console.log('📱 NFC: Authorization verification result:', isValid);
      } catch (error) {
        console.error('📱 NFC: Failed to verify authorization:', error);
      }

      return result;
    }
  };
};
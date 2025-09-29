import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';
import {
  keccak256,
  serializeTransaction,
  type Hex,
  concat,
  numberToHex
} from 'viem';
import { encode as rlpEncode } from '@ethereumjs/rlp';

export interface NFCCardData {
  address: `0x${string}`;
  publicKey: string;
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
  try {
    // Note: This requires either:
    // 1. HaLo Bridge running on desktop (with USB NFC reader)
    // 2. Android Chrome with NFC enabled
    // Will fail on desktop browsers without HaLo Bridge
    const result = await execHaloCmdWeb({
      name: 'get_pkeys',
      rpId: getRpId()
    });
    
    const address = result.etherAddresses?.['1'] as `0x${string}`;
    const publicKey = result.publicKeys?.['1'];
    
    if (!address || !publicKey) {
      throw new Error('Failed to extract card data');
    }
    
    return { address, publicKey };
  } catch (error: any) {
    console.error('Failed to get card data:', error);
    
    // Check for common errors
    if (error.message?.includes('NotAllowedError') || error.message?.includes("device can't be used")) {
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
    const command: any = {
      name: 'sign',
      keyNo: 1,
      rpId: getRpId()
    };

    if (isRawDigest) {
      // For raw digests (like transaction hashes), use digest parameter
      command.digest = message;
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

    console.log('NFC Sign Command:', JSON.stringify(command, null, 2));
    const result = await execHaloCmdWeb(command);
    console.log('NFC Sign Result:', JSON.stringify(result, null, 2));

    if (!result.signature) {
      throw new Error(`No signature returned from card. Result: ${JSON.stringify(result)}`);
    }

    return result.signature.ether as Hex;
  } catch (error: any) {
    console.error('NFC signing failed - Full Error:', error);

    // Create detailed error message
    const errorDetails = {
      message: error.message || 'Unknown error',
      type: error.name || 'Error',
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
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
      // For string messages, we need to pass the raw message to the NFC card
      // The NFC card will handle the Ethereum prefix and hashing
      const messageToSign = typeof message === 'string'
        ? message  // Pass raw message, not hash
        : message.raw;

      const signature = await signWithNFC(messageToSign);
      return signature;
    },
    signTransaction: async (transaction: any) => {
      console.log('NFC signTransaction called with:', {
        to: transaction.to,
        from: address,
        value: transaction.value?.toString(),
        data: transaction.data?.slice(0, 10) + '...',
        nonce: transaction.nonce,
        gasLimit: transaction.gasLimit?.toString(),
        chainId: transaction.chainId
      });

      const serialized = serializeTransaction(transaction);
      console.log('Serialized transaction:', serialized);

      const hash = keccak256(serialized);
      console.log('Transaction hash to sign:', hash);

      // Pass true for isRawDigest since this is a transaction hash
      const signature = await signWithNFC(hash, true);
      console.log('Transaction signature received:', signature);

      return signature;
    },
    signTypedData: async () => {
      throw new Error('Typed data signing not yet implemented');
    },
    signAuthorization: async (authorization: any) => {
      try {
        // Build the authorization hash according to EIP-7702 spec
        // Format: keccak256(0x05 || rlp([chain_id, address, nonce]))

        const chainId = authorization.chainId || 11155420; // Default to OP Sepolia
        const nonce = authorization.nonce || 0n;

        console.log('EIP-7702 Authorization Request:', {
          contractAddress: authorization.contractAddress,
          chainId,
          nonce: nonce.toString()
        });

        // Prepare values for RLP encoding
        const rlpData = [
          // Chain ID as hex (0x for 0, otherwise hex number)
          chainId === 0 ? '0x' : numberToHex(chainId),
          // Contract address
          authorization.contractAddress,
          // Nonce as hex (0x for 0, otherwise hex number)
          nonce === 0n ? '0x' : numberToHex(nonce),
        ];

        console.log('RLP Data:', rlpData);

        // RLP encode the data
        const rlpEncoded = rlpEncode(rlpData);

        // Prepend magic byte 0x05 for EIP-7702
        const MAGIC_BYTE = 0x05;
        const message = concat([
          new Uint8Array([MAGIC_BYTE]),
          rlpEncoded
        ]);

        // Hash the complete message
        const digest = keccak256(message);
        console.log('Authorization digest to sign:', digest);

        // Sign the raw digest with NFC
        const signature = await signWithNFC(digest, true);
        console.log('Authorization signature:', signature);

        // Parse signature components
        const r = `0x${signature.slice(2, 66)}` as Hex;
        const s = `0x${signature.slice(66, 130)}` as Hex;
        const v = parseInt(signature.slice(130, 132), 16);
        const yParity = v === 27 ? 0 : 1;

        const result = {
          contractAddress: authorization.contractAddress,
          chainId,
          nonce,
          r,
          s,
          yParity
        };

        console.log('Authorization result:', result);
        return result;
      } catch (error: any) {
        console.error('signAuthorization failed:', error);
        throw new Error(`EIP-7702 Auth Failed: ${error.message}`);
      }
    }
  };
};
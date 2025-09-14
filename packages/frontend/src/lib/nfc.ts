import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';
import { keccak256, serializeTransaction, type Hex } from 'viem';

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
    
    const result = await execHaloCmdWeb(command);
    
    if (!result.signature) {
      throw new Error('No signature returned from card');
    }
    
    return result.signature.ether as Hex;
  } catch (error) {
    console.error('NFC signing failed:', error);
    throw new Error('Failed to sign with NFC card. Please try again.');
  }
};

export const createNFCAccount = (address: `0x${string}`) => {
  return {
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
      const serialized = serializeTransaction(transaction);
      const hash = keccak256(serialized);
      // Pass true for isRawDigest since this is a transaction hash
      const signature = await signWithNFC(hash, true);
      return signature;
    },
    signTypedData: async () => {
      throw new Error('Typed data signing not yet implemented');
    }
  };
};
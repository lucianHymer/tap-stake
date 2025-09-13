import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';
import { hashMessage, keccak256, serializeTransaction, parseSignature, type Hex } from 'viem';

export interface NFCCardData {
  address: `0x${string}`;
  publicKey: string;
}

export const getCardData = async (): Promise<NFCCardData> => {
  try {
    const result = await execHaloCmdWeb({
      name: 'get_pkeys'
    });
    
    const address = result.etherAddresses?.['1'] as `0x${string}`;
    const publicKey = result.publicKeys?.['1'];
    
    if (!address || !publicKey) {
      throw new Error('Failed to extract card data');
    }
    
    return { address, publicKey };
  } catch (error) {
    console.error('Failed to get card data:', error);
    throw new Error('Failed to read NFC card. Please ensure NFC is enabled and try again.');
  }
};

export const signWithNFC = async (message: string | Hex): Promise<Hex> => {
  try {
    const command = {
      name: 'sign',
      message: message,
      keyNo: 1
    };
    
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
      const messageToSign = typeof message === 'string' 
        ? hashMessage(message)
        : message.raw;
      
      const signature = await signWithNFC(messageToSign);
      return signature;
    },
    signTransaction: async (transaction: any) => {
      const serialized = serializeTransaction(transaction);
      const hash = keccak256(serialized);
      const signature = await signWithNFC(hash);
      return signature;
    },
    signTypedData: async (typedData: any) => {
      throw new Error('Typed data signing not yet implemented');
    }
  };
};
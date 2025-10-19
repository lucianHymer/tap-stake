import { privateKeyToAccount } from 'viem/accounts';
import { createNFCAccount, getCardData } from './nfc';

// DEV MODE: Set to true to use a hardcoded test wallet instead of NFC
const USE_DEV_WALLET = import.meta.env.VITE_USE_DEV_WALLET === 'true';
const DEV_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat account #0

export interface NFCConnection {
  address: `0x${string}`;
  account: ReturnType<typeof createNFCAccount> | ReturnType<typeof privateKeyToAccount>;
}

class NFCResource {
  private static promise: Promise<NFCConnection> | null = null;
  private static result: NFCConnection | null = null;
  private static error: Error | null = null;

  static read(): NFCConnection {
    if (NFCResource.error) {
      throw NFCResource.error;
    }

    if (NFCResource.result) {
      return NFCResource.result;
    }

    if (!NFCResource.promise) {
      NFCResource.promise = NFCResource.connect();
    }

    throw NFCResource.promise;
  }

  private static async connect(): Promise<NFCConnection> {
    try {
      // DEV MODE: Use hardcoded wallet for testing
      if (USE_DEV_WALLET) {
        console.log('🔧 DEV MODE: Using hardcoded test wallet');
        const account = privateKeyToAccount(DEV_PRIVATE_KEY as `0x${string}`);
        NFCResource.result = { address: account.address, account };
        return NFCResource.result;
      }

      // Get card data - this will wait for NFC tap
      // Note: This is now triggered by a user button click, which provides
      // the necessary user gesture for WebAuthn to work properly
      const cardData = await getCardData();
      const address = cardData.address;

      // Create the NFC account
      const account = createNFCAccount(address);

      NFCResource.result = { address, account };
      return NFCResource.result;
    } catch (error) {
      NFCResource.error = error instanceof Error ? error : new Error('Failed to connect NFC');
      throw NFCResource.error;
    }
  }

  static reset() {
    NFCResource.promise = null;
    NFCResource.result = null;
    NFCResource.error = null;
  }
}

export function readNFCConnection(): NFCConnection {
  return NFCResource.read();
}

export function resetNFCConnection() {
  NFCResource.reset();
}

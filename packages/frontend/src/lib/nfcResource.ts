import { getCardData, createNFCAccount } from './nfc';

export interface NFCConnection {
  address: `0x${string}`;
  account: ReturnType<typeof createNFCAccount>;
}

class NFCResource {
  private static promise: Promise<NFCConnection> | null = null;
  private static result: NFCConnection | null = null;
  private static error: Error | null = null;

  static read(): NFCConnection {
    if (this.error) {
      throw this.error;
    }
    
    if (this.result) {
      return this.result;
    }
    
    if (!this.promise) {
      this.promise = this.connect();
    }
    
    throw this.promise;
  }

  private static async connect(): Promise<NFCConnection> {
    try {
      // Get card data - this will wait for NFC tap
      // Note: This is now triggered by a user button click, which provides
      // the necessary user gesture for WebAuthn to work properly
      const cardData = await getCardData();
      const address = cardData.address;

      // Create the NFC account
      const account = createNFCAccount(address);

      this.result = { address, account };
      return this.result;
    } catch (error) {
      this.error = error instanceof Error ? error : new Error('Failed to connect NFC');
      throw this.error;
    }
  }

  static reset() {
    this.promise = null;
    this.result = null;
    this.error = null;
  }
}

export function readNFCConnection(): NFCConnection {
  return NFCResource.read();
}

export function resetNFCConnection() {
  NFCResource.reset();
}
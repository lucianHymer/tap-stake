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
      // Small delay to ensure WebAuthn context is ready
      // This prevents the NFC card from being read as a regular tag
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get card data - this will wait for NFC tap
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
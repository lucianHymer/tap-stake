import { useState } from 'react';
import { getCardData, createNFCAccount } from './lib/nfc';
import { recoverMessageAddress, type Hex } from 'viem';
import './App.css';

interface SignatureResult {
  message: string;
  signature: Hex;
  signerAddress: `0x${string}`;
  recoveredAddress?: `0x${string}`;
  verified: boolean;
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);
  const [cardAddress, setCardAddress] = useState<`0x${string}` | null>(null);

  const handleGetCardInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cardData = await getCardData();
      setCardAddress(cardData.address);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read card');
      setCardAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignMessage = async () => {
    if (!cardAddress) {
      setError('Please read card first');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const message = "Hello from NFC Wallet!";
      const account = createNFCAccount(cardAddress);
      const signature = await account.signMessage({ message });
      
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature
      });
      
      const verified = recoveredAddress.toLowerCase() === cardAddress.toLowerCase();
      
      setSignatureResult({
        message,
        signature,
        signerAddress: cardAddress,
        recoveredAddress,
        verified
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign message');
      setSignatureResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSignatureResult(null);
    setCardAddress(null);
    setError(null);
  };

  return (
    <div className="container">
      <header>
        <h1>Tap-Stake NFC Wallet</h1>
        <p className="subtitle">Sign messages with your NFC card</p>
      </header>

      <main>
        {!cardAddress && (
          <div className="card">
            <h2>Step 1: Read NFC Card</h2>
            <p>First, tap your NFC card to read its address</p>
            <button 
              onClick={handleGetCardInfo}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Reading...' : 'Read NFC Card'}
            </button>
          </div>
        )}

        {cardAddress && !signatureResult && (
          <div className="card">
            <div className="info-box">
              <strong>Card Address:</strong>
              <code>{cardAddress}</code>
            </div>
            
            <h2>Step 2: Sign Message</h2>
            <p>Now tap your card again to sign a message</p>
            <button 
              onClick={handleSignMessage}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Signing...' : 'Sign Message'}
            </button>
          </div>
        )}

        {signatureResult && (
          <div className="card result-card">
            <h2>Signature Created!</h2>
            
            <div className="result-section">
              <strong>Message:</strong>
              <p>{signatureResult.message}</p>
            </div>
            
            <div className="result-section">
              <strong>Signer Address:</strong>
              <code className="address">{signatureResult.signerAddress}</code>
            </div>
            
            <div className="result-section">
              <strong>Signature:</strong>
              <code className="signature">{signatureResult.signature}</code>
            </div>
            
            {signatureResult.recoveredAddress && (
              <div className="result-section">
                <strong>Recovered Address:</strong>
                <code className="address">{signatureResult.recoveredAddress}</code>
              </div>
            )}
            
            <div className={`verification ${signatureResult.verified ? 'verified' : 'not-verified'}`}>
              {signatureResult.verified ? 'Signature Verified' : 'Signature Verification Failed'}
            </div>
            
            <button onClick={handleClear} className="btn btn-secondary">
              Start Over
            </button>
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="info-card">
          <h3>Requirements</h3>
          <ul>
            <li>NFC-enabled device (Android phone or desktop with NFC reader)</li>
            <li>Chrome browser with Web NFC API support</li>
            <li>Initialized HaLo NFC card with ECDSA keys</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App

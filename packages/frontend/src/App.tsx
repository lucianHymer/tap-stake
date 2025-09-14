import { useState } from 'react';
import { getCardData, createNFCAccount } from './lib/nfc';
import { recoverMessageAddress, type Hex } from 'viem';
import moloch1 from '../moloch1.png';
import moloch2 from '../moloch2.png';
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
  const [isStaked, setIsStaked] = useState(false);

  const handleMolochClick = async () => {
    setIsStaked(true);
    setTimeout(() => setIsStaked(false), 500);
    
    if (!cardAddress) {
      await handleGetCardInfo();
    } else if (!signatureResult) {
      await handleSignMessage();
    }
  };

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
      const message = "I SLAY MOLOCH, DEMON OF DIS-COORDINATION!";
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
    setIsStaked(false);
  };

  return (
    <div className="demon-container">
      <header className="demon-header">
        <h1 className="title">
          <span>TAP</span>
          <span>STAKE</span>
        </h1>
      </header>

      <main className="demon-main">
        <div className="moloch-section">
          <div 
            className={`moloch-image-container ${isStaked ? 'staked' : ''}`}
            onClick={handleMolochClick}
          >
            <img 
              src={isStaked ? moloch2 : moloch1} 
              alt="Moloch - Demon of Dis-coordination"
              className="moloch-image"
            />
          </div>
          
          <div className="demon-status">
            {!cardAddress && (
              <p className="demon-text">TAP THE STAKE TO BEGIN THE RITUAL</p>
            )}
            {cardAddress && !signatureResult && (
              <p className="demon-text">TAP AGAIN TO DRIVE THE STAKE DEEPER</p>
            )}
            {signatureResult && signatureResult.verified && (
              <p className="demon-text victory">MOLOCH IS SLAIN! COORDINATION RESTORED!</p>
            )}
          </div>
        </div>

        {error && (
          <div className="blood-box">
            <strong>RITUAL FAILED:</strong> {error}
          </div>
        )}

        {cardAddress && (
          <div className="tech-section">
            <div className="tech-card">
              <div className="tech-label">SLAYER'S SIGIL</div>
              <code className="address-display">{cardAddress}</code>
            </div>
          </div>
        )}

        {signatureResult && (
          <div className="tech-section">
            <div className="tech-card">
              <div className="tech-label">INCANTATION</div>
              <p className="incantation">{signatureResult.message}</p>
            </div>
            
            <div className="tech-card">
              <div className="tech-label">BLOOD SEAL</div>
              <code className="signature-display">{signatureResult.signature}</code>
            </div>
            
            {signatureResult.recoveredAddress && (
              <div className="tech-card">
                <div className="tech-label">VERIFIED SLAYER</div>
                <code className="address-display">{signatureResult.recoveredAddress}</code>
              </div>
            )}
            
            <div className={`verification-ritual ${signatureResult.verified ? 'sanctified' : 'corrupted'}`}>
              {signatureResult.verified ? '✓ RITUAL SANCTIFIED' : '✗ RITUAL CORRUPTED'}
            </div>
            
            <button onClick={handleClear} className="btn-demon">
              RESURRECT MOLOCH (START OVER)
            </button>
          </div>
        )}

        <div className="footer-info">
          <details className="tech-details">
            <summary>ARCANE REQUIREMENTS</summary>
            <ul>
              <li>NFC-enabled device (Android phone or desktop with NFC reader)</li>
              <li>Chrome browser with Web NFC API support</li>
              <li>Initialized HaLo NFC card with ECDSA keys</li>
            </ul>
          </details>
        </div>
      </main>
    </div>
  );
}

export default App

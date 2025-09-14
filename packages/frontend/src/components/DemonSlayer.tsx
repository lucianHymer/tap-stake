import { useState } from 'react';
import { recoverMessageAddress, type Hex } from 'viem';
import moloch1 from '../assets/images/moloch1.png';
import moloch2 from '../assets/images/moloch2.png';
import type { NFCConnection } from '../lib/nfcResource';

interface SignatureResult {
  message: string;
  signature: Hex;
  signerAddress: `0x${string}`;
  recoveredAddress?: `0x${string}`;
  verified: boolean;
}

interface DemonSlayerProps {
  connection: NFCConnection;
}

export function DemonSlayer({ connection }: DemonSlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);
  const [isStaked, setIsStaked] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const handleMolochClick = async () => {
    if (!signatureResult) {
      await handleSignMessage();
    }
  };

  const handleSignMessage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const message = "I SLAY MOLOCH, DEMON OF DIS-COORDINATION!";
      // The walletClient.account is our NFC account with signMessage method
      const account = connection.account;
      if (!account || !('signMessage' in account)) {
        throw new Error('Invalid account');
      }
      
      const signature = await account.signMessage({ message });
      
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature
      });
      
      const verified = recoveredAddress.toLowerCase() === connection.address.toLowerCase();
      
      setSignatureResult({
        message,
        signature,
        signerAddress: connection.address as `0x${string}`,
        recoveredAddress,
        verified
      });
      
      setError(null);
      
      // If verified, trigger the stake animation after 300ms
      if (verified) {
        setTimeout(() => {
          setIsStaked(true);
          
          // Play Wilhelm scream
          const audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/d/d9/Wilhelm_Scream.ogg');
          audio.volume = 0.5; // Not too loud
          audio.play().catch(err => console.log('Could not play Wilhelm scream:', err));
          
          // Show victory text after scream (about 1 second for the scream to play)
          setTimeout(() => {
            setShowVictory(true);
          }, 1000);
        }, 300);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign message');
      setSignatureResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSignatureResult(null);
    setError(null);
    setIsStaked(false);
    setShowVictory(false);
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
            className={`moloch-image-container ${isStaked ? 'staked' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={handleMolochClick}
          >
            <img 
              src={isStaked ? moloch2 : moloch1} 
              alt="Moloch - Demon of Dis-coordination"
              className="moloch-image"
            />
          </div>
          
          <div className="demon-status">
            {!signatureResult && !isLoading && (
              <p className="demon-text">TAP THE STAKE TO SLAY MOLOCH</p>
            )}
            {isLoading && (
              <p className="demon-text" style={{color: '#ffaa00'}}>AWAITING NFC SIGNATURE...</p>
            )}
            {showVictory && (
              <p className="demon-text victory">MOLOCH IS SLAIN! COORDINATION RESTORED!</p>
            )}
          </div>
        </div>

        {error && (
          <div className="blood-box">
            <strong>RITUAL FAILED:</strong> {error}
          </div>
        )}

        <div className="tech-section">
          <div className="tech-card">
            <div className="tech-label">SLAYER'S SIGIL</div>
            <code className="address-display">{connection.address}</code>
          </div>
        </div>

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
import { useState } from 'react';
import { createPublicClient, http, parseEther, type Address } from 'viem';
import { optimismSepolia } from 'viem/chains';
import moloch1 from '../assets/images/moloch1.png';
import moloch2 from '../assets/images/moloch2.png';
import type { NFCConnection } from '../lib/nfcResource';

// Deployed contract addresses - Updated October 14, 2025
const CONTRACTS = {
  testToken: "0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756" as Address,
  stakeChoicesToken: "0xb8D2655B94a007c5855d85d4bd51E07c3c47521F" as Address,
  stakerWallet: "0xeb5ed03c030448270d5671cd4ae79ad124765f26" as Address,
};

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || "http://localhost:8787";

interface StakeResult {
  txHash: string;
  blockNumber: bigint;
  gasUsed: bigint;
}

interface DemonSlayerProps {
  connection: NFCConnection;
}

export function DemonSlayer({ connection }: DemonSlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakeResult, setStakeResult] = useState<StakeResult | null>(null);
  const [isStaked, setIsStaked] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  const handleMolochClick = async () => {
    if (!stakeResult) {
      await handleStake();
    }
  };

  const handleStake = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('⚔️ DemonSlayer: Beginning stake ritual...');
      const account = connection.account;
      if (!account || !('signAuthorization' in account)) {
        throw new Error('Invalid NFC account');
      }

      // Get current transaction nonce for EIP-7702 authorization
      const txNonce = await publicClient.getTransactionCount({
        address: connection.address,
      });
      console.log('⚔️ DemonSlayer: Current nonce:', txNonce);

      // Multi-choice stake: 20 TEST on choice 1, 30 TEST on choice 4
      // Using actual choice IDs from deployment (1st and 4th registered choices)
      const choiceIds = [
        "35944569015047981758235818500518690797898803954137960285681681313226267984075",  // Choice 1
        "97940999879862486104046856375658994738036738590581900819813490438205806384215",  // Choice 4
      ];
      const amounts = [
        parseEther("20").toString(),  // 20 TEST on choice 1
        parseEther("30").toString(),  // 30 TEST on choice 4
      ];

      // Sign EIP-7702 authorization
      console.log('⚔️ DemonSlayer: Requesting authorization signature...');
      const authorization = await account.signAuthorization({
        address: CONTRACTS.stakerWallet,
        chainId: optimismSepolia.id,
        nonce: txNonce,
      });
      console.log('⚔️ DemonSlayer: Authorization signed:', authorization);

      // Send to relayer
      console.log('⚔️ DemonSlayer: Sending to relayer with multi-choice stakes...');
      const relayPayload = {
        authorization: {
          address: authorization.address,
          chainId: authorization.chainId,
          nonce: authorization.nonce.toString(),
          r: authorization.r,
          s: authorization.s,
          yParity: authorization.yParity,
        },
        choiceIds,
        amounts,
      };

      const response = await fetch(RELAYER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relayPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('⚔️ DemonSlayer: Relay failed:', result);
        throw new Error(result.error || 'Relay failed');
      }

      console.log('⚔️ DemonSlayer: Transaction submitted! Hash:', result.txHash);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result.txHash
      });
      console.log('⚔️ DemonSlayer: Transaction confirmed!', {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      setStakeResult({
        txHash: result.txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      });

      setError(null);

      // Trigger victory animation
      setTimeout(() => {
        setIsStaked(true);

        // Play Wilhelm scream
        const audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/d/d9/Wilhelm_Scream.ogg');
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Could not play Wilhelm scream:', err));

        // Show victory text after scream
        setTimeout(() => {
          setShowVictory(true);
        }, 1000);
      }, 300);
    } catch (err) {
      console.error('⚔️ DemonSlayer: Stake failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to stake';
      setError(errorMessage);
      setStakeResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setStakeResult(null);
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
            {!stakeResult && !isLoading && (
              <p className="demon-text">TAP THE STAKE TO SLAY MOLOCH<br/>
              <span style={{fontSize: '0.8em', opacity: 0.8}}>20 TEST → Choice 1 | 30 TEST → Choice 4</span></p>
            )}
            {isLoading && (
              <p className="demon-text" style={{color: '#ffaa00'}}>PERFORMING BLOOD RITUAL...</p>
            )}
            {showVictory && (
              <p className="demon-text victory">MOLOCH IS SLAIN! COORDINATION RESTORED!<br/>
              <span style={{fontSize: '0.8em'}}>50 TEST staked across 2 choices</span></p>
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

        {stakeResult && (
          <div className="tech-section">
            <div className="tech-card">
              <div className="tech-label">VICTORY RECORD</div>
              <a
                href={`https://sepolia-optimism.etherscan.io/tx/${stakeResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00ffff', wordBreak: 'break-all' }}
              >
                {stakeResult.txHash}
              </a>
            </div>

            <div className="tech-card">
              <div className="tech-label">BLOCK SEALED</div>
              <code className="address-display">{stakeResult.blockNumber.toString()}</code>
            </div>

            <div className="verification-ritual sanctified">
              ✓ MOLOCH BANISHED TO THE BLOCKCHAIN
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

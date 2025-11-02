import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http, createPublicClient, formatEther, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia } from 'viem/chains';
import { Button } from '../components/Button';
import { GameCard } from '../components/GameCard';
import { PageWrapper } from '../components/PageWrapper';
import { ASSETS } from '../config/assets';
import { useAppContext } from '../contexts/AppContext';
import { createNFCAccount, getCardData } from '../lib/nfc';
import { checkBalances } from '../utils/balances';
import styles from './TestPage.module.css';

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:8787';

export function TestPage() {
  const { actions } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  const handleBurnerCard = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🎴 Test: Starting burner card mint flow...');

      // Clear any stored generated wallet since we're using NFC
      sessionStorage.removeItem('generatedWallet');
      actions.resetAll();

      // 1. Connect NFC card (just for minting)
      console.log('🎴 Test: Reading NFC card...');
      const cardData = await getCardData();
      const address = cardData.address;

      console.log('🎴 Test: Connected to:', address);

      // 2. Check current holdings (wallet + all stakes)
      console.log('🎴 Test: Checking balances...');
      // @ts-expect-error - Optimism chain types differ
      const { walletBalance, existingStakes } = await checkBalances(publicClient, address);

      const totalStaked = Array.from(existingStakes.values()).reduce((sum, amt) => sum + amt, 0n);
      const totalHoldings = walletBalance + totalStaked;

      console.log('🎴 Test: Holdings:', {
        wallet: formatEther(walletBalance),
        staked: formatEther(totalStaked),
        total: formatEther(totalHoldings),
      });

      // 3. Top up to 100 GTC if needed
      const target = parseEther('100');
      if (totalHoldings < target) {
        const mintAmount = target - totalHoldings;
        console.log(`🎴 Test: Topping up ${formatEther(mintAmount)} GTC...`);

        const mintResponse = await fetch(`${RELAYER_URL}/test-mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            amount: mintAmount.toString(),
          }),
        });

        if (!mintResponse.ok) {
          throw new Error(`Mint failed: ${await mintResponse.text()}`);
        }

        console.log(`🎴 Test: Topped up ${formatEther(mintAmount)} GTC to reach 100 total`);
      } else {
        console.log('🎴 Test: Already has 100+ GTC, no top-up needed');
      }

      console.log('🎴 Test: Tokens minted! Redirecting to connect page...');
      navigate('/');
    } catch (err) {
      console.error('🎴 Test: Burner card mint failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint to burner card';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToConnect = () => {
    navigate('/');
  };

  const handleClearSession = () => {
    sessionStorage.removeItem('generatedWallet');
    actions.resetAll();
    setError(null);
    console.log('🔑 Test: Stored wallet cleared');
  };

  const handleNoCard = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔑 Test: Generating new wallet...');

      // 1. Generate new wallet
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);
      const address = account.address;

      console.log('🔑 Test: Generated wallet:', address);

      // Store in sessionStorage for this session
      sessionStorage.setItem('generatedWallet', privateKey);

      // 2. Mint 100 GTC
      console.log('🔑 Test: Minting 100 GTC...');
      const mintAmount = parseEther('100');
      const mintResponse = await fetch(`${RELAYER_URL}/test-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          amount: mintAmount.toString(),
        }),
      });

      if (!mintResponse.ok) {
        throw new Error(`Mint failed: ${await mintResponse.text()}`);
      }

      console.log('🔑 Test: Minted 100 GTC, navigating to connect page...');
      navigate('/');
    } catch (err) {
      console.error('🔑 Test: Generated wallet flow failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate wallet';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className={styles.compact}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Burner Card</h3>
          <div className={styles.buttonRow}>
            <Button variant="outline" onClick={handleBurnerCard} disabled={loading}>
              Mint 100 Test GTC to Burner
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Auto-Generated Wallet</h3>
          <div className={styles.buttonRow}>
            <Button variant="outline" onClick={handleNoCard} disabled={loading}>
              Generate Wallet with 100 GTC
            </Button>
            <Button variant="outline" onClick={handleClearSession} disabled={loading}>
              Clear Session
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Exit Test Page</h3>
          <div className={styles.buttonRow}>
            <Button variant="outline" onClick={handleGoToConnect} disabled={loading}>
              Go to Connect
            </Button>
          </div>
        </div>

        {loading && <p className={styles.loading}>Preparing...</p>}

        {error && (
          <div className={styles.error}>
            <strong>Failed:</strong> {error}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

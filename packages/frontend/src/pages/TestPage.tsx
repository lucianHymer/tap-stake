import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http, createPublicClient, formatEther, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia } from 'viem/chains';
import { Button } from '../components/Button';
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
      console.log('🎴 Test: Starting burner card flow...');

      // 1. Connect NFC card
      console.log('🎴 Test: Reading NFC card...');
      const cardData = await getCardData();
      const address = cardData.address;
      const account = createNFCAccount(address);

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

      // 3. Top up to 100 GTC if needed (ONLY for test page users)
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

      // 4. Store in app state and navigate
      actions.setConnection({
        connectedAddress: address,
        account,
        isGeneratedWallet: false,
      });

      // Also update balances in state (after potential top-up)
      // @ts-expect-error - Optimism chain types differ
      const updatedBalances = await checkBalances(publicClient, address);
      actions.setBalances(updatedBalances);

      console.log('🎴 Test: Navigating to connect page...');
      navigate('/');
    } catch (err) {
      console.error('🎴 Test: Burner card flow failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect burner card';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

      console.log('🔑 Test: Minted 100 GTC');

      // 3. Store in app state and navigate
      actions.setConnection({
        connectedAddress: address,
        account,
        isGeneratedWallet: true,
      });

      // Set initial balance (no existing stakes for new wallet)
      actions.setBalances({
        walletBalance: mintAmount,
        existingStakes: new Map(),
      });

      console.log('🔑 Test: Navigating to connect page...');
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
    <div className={styles.testPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          <span className={styles.titleWord}>TAP</span>
          <span className={styles.titleWord}>STAKE</span>
        </h1>

        <p className={styles.subtitle}>Choose your path to slay Moloch:</p>

        <div className={styles.options}>
          <Button variant="outline" onClick={handleBurnerCard} disabled={loading}>
            I have a burner card
          </Button>

          <Button variant="outline" onClick={handleNoCard} disabled={loading}>
            I don't have a burner
          </Button>
        </div>

        {loading && <p className={styles.loading}>Preparing for battle...</p>}

        {error && (
          <div className={styles.error}>
            <strong>Failed:</strong> {error}
          </div>
        )}

        <div className={styles.note}>
          <p>
            <strong>Note:</strong> This is the test page for setting up new accounts. If you're
            returning, go directly to the <a href="#/">main page</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

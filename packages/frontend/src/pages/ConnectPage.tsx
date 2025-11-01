import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http, createPublicClient } from 'viem';
import { type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia } from 'viem/chains';
import { ConnectCard } from '../components/ConnectCard';
import { useAppContext } from '../contexts/AppContext';
import { createNFCAccount, getCardData } from '../lib/nfc';
import { checkBalances } from '../utils/balances';
import styles from './ConnectPage.module.css';

export function ConnectPage() {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      let address: `0x${string}`;
      let account: ReturnType<typeof createNFCAccount> | PrivateKeyAccount;

      // Check if we have a stored generated wallet in sessionStorage
      const storedPrivateKey = sessionStorage.getItem('generatedWallet');

      if (storedPrivateKey) {
        // Use stored generated wallet from sessionStorage
        console.log('🔗 Connect: Using stored generated wallet');
        account = privateKeyToAccount(storedPrivateKey as `0x${string}`);
        address = account.address;

        // Store in AppContext
        actions.setConnection({
          connectedAddress: address,
          account,
          isGeneratedWallet: true,
        });
      } else if (state.connection.connectedAddress && state.connection.account) {
        // Use existing connection from AppContext (from TestPage)
        console.log('🔗 Connect: Using existing connection from AppContext');
        address = state.connection.connectedAddress;
        account = state.connection.account;
      } else {
        // Connect NFC (for users who go directly to / without visiting /test)
        console.log('🔗 Connect: Reading NFC card...');
        const cardData = await getCardData();
        address = cardData.address;
        account = createNFCAccount(address);

        // Store in AppContext
        actions.setConnection({
          connectedAddress: address,
          account,
          isGeneratedWallet: false,
        });
      }

      console.log('🔗 Connect: Connected to:', address);

      // Check balances
      console.log('🔗 Connect: Checking balances...');
      // @ts-expect-error - Optimism chain types differ
      const balances = await checkBalances(publicClient, address);
      actions.setBalances(balances);

      console.log('🔗 Connect: Balances:', {
        wallet: balances.walletBalance.toString(),
        stakes: balances.existingStakes.size,
      });

      // Navigate based on existing stakes
      if (balances.existingStakes.size > 0) {
        console.log('🔗 Connect: Has existing stakes, navigating to /slain');
        navigate('/slain');
      } else {
        console.log('🔗 Connect: No stakes, navigating to /choices');
        navigate('/choices');
      }
    } catch (err) {
      console.error('🔗 Connect: Connection failed:', err);

      // Show user-friendly error message below the button
      const errorObj = err instanceof Error ? err : new Error(String(err));
      let errorMessage = 'Failed to connect. Please try again.';

      if (errorObj.message.includes('WebAuthn') || errorObj.message.includes('NFC')) {
        errorMessage = 'Card reader not detected. Please tap your card when prompted.';
      } else if (errorObj.message.includes('timeout')) {
        errorMessage = 'Connection timed out. Please try again.';
      } else if (errorObj.message.includes('network') || errorObj.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className={styles.connectPage}>
      <ConnectCard onConnect={handleConnect} />

      {/* Status overlay - shown during connection */}
      {isConnecting && (
        <div className={styles.statusOverlay}>
          <div className={styles.statusContent}>
            <div className={styles.statusIcon}>⚔️</div>
            <h3 className={styles.statusHeading}>Communing with the spirits...</h3>
            <p className={styles.statusText}>Tap your card when prompted</p>
          </div>
        </div>
      )}

      {/* Error message - shown below the card */}
      {error && !isConnecting && (
        <div className={styles.errorMessage}>
          <strong>Connection Failed:</strong> {error}
        </div>
      )}
    </div>
  );
}

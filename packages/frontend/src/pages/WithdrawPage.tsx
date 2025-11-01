import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http, createPublicClient } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { MolochRisesCard } from '../components/MolochRisesCard';
import { PageWrapper } from '../components/PageWrapper';
import { CONTRACTS } from '../config/contracts';
import { useAppContext } from '../contexts/AppContext';
import { CHOICE_ID_MAPPING } from '../utils/balances';
import styles from './WithdrawPage.module.css';

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:8787';

export function WithdrawPage() {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  const handleRunAway = async (destinationAddress: string) => {
    if (!destinationAddress) {
      setError('Please enter a destination address');
      return;
    }

    setIsWithdrawing(true);
    setError(null);

    try {
      console.log('🏃 Withdraw: Starting withdrawal to:', destinationAddress);

      if (!state.connection.account || !state.connection.connectedAddress) {
        throw new Error('No account connected');
      }

      const account = state.connection.account;
      const address = state.connection.connectedAddress;

      // Get current transaction nonce for EIP-7702 authorization
      const txNonce = await publicClient.getTransactionCount({ address });
      console.log('🏃 Withdraw: Transaction nonce:', txNonce);

      // Sign authorization
      console.log('🏃 Withdraw: Requesting authorization signature...');
      if (!('signAuthorization' in account) || !account.signAuthorization) {
        throw new Error('Account does not support signAuthorization');
      }

      const authorization = await account.signAuthorization!({
        address: CONTRACTS.stakerWallet,
        chainId: optimismSepolia.id,
        nonce: txNonce,
      });

      console.log('🏃 Withdraw: Authorization signed');

      // Prepare withdrawal data based on stakes
      const hasStakes = state.balances.existingStakes.size > 0;
      let operation: 'withdraw' | 'unstakeAllAndWithdraw';
      let operationData: any;

      if (hasStakes) {
        // Has stakes - unstake all and withdraw
        console.log('🏃 Withdraw: Unstaking all positions and withdrawing');
        operation = 'unstakeAllAndWithdraw';
        operationData = {
          operation,
          choiceIds: Array.from(state.balances.existingStakes.keys()).map(
            (c) => CHOICE_ID_MAPPING[c]
          ),
          amounts: Array.from(state.balances.existingStakes.values()).map((a) => a.toString()),
          recipient: destinationAddress,
        };
      } else {
        // No stakes - just withdraw
        console.log('🏃 Withdraw: Withdrawing wallet balance only');
        operation = 'withdraw';
        operationData = {
          operation,
          recipient: destinationAddress,
        };
      }

      // Submit to relayer
      const relayPayload = {
        authorization: {
          address: authorization.address,
          chainId: authorization.chainId,
          nonce: authorization.nonce.toString(),
          r: authorization.r,
          s: authorization.s,
          yParity: authorization.yParity,
        },
        ...operationData,
      };

      console.log('🏃 Withdraw: Submitting to relayer...');
      const response = await fetch(`${RELAYER_URL}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relayPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      console.log('🏃 Withdraw: Transaction submitted!', result.txHash);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result.txHash,
      });

      console.log('🏃 Withdraw: Transaction confirmed!', {
        blockNumber: receipt.blockNumber.toString(),
      });

      // Clear state and navigate back to start
      console.log('🏃 Withdraw: Clearing state and returning to start');
      actions.resetAll();

      // Clear sessionStorage for generated wallets
      sessionStorage.removeItem('generatedWallet');

      // Navigate to test page
      navigate('/test');
    } catch (err) {
      console.error('🏃 Withdraw: Withdrawal failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleGoBack = () => {
    console.log('🏃 Withdraw: Going back to choices');
    navigate('/choices');
  };

  // Show loading state in card if withdrawing
  if (isWithdrawing) {
    return (
      <PageWrapper>
        <div className={styles.loadingContent}>
          <div className={styles.loadingIcon}>🏃</div>
          <h2 className={styles.loadingHeading}>Running away...</h2>
          <p className={styles.loadingText}>Please wait while we process your withdrawal</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <MolochRisesCard onRunAway={handleRunAway} onGoBack={handleGoBack} />

      {error && (
        <div className={styles.errorMessage}>
          <strong>Withdrawal Failed:</strong> {error}
        </div>
      )}
    </PageWrapper>
  );
}

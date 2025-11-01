import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { http, createPublicClient, parseEther } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { ChoicesCard } from '../components/ChoicesCard';
import { PageWrapper } from '../components/PageWrapper';
import { TransactionStatus } from '../components/TransactionStatus';
import { CONTRACTS } from '../config/contracts';
import { useAppContext } from '../contexts/AppContext';
import { CHOICE_NAMES } from '../utils/balances';
import { calculateAvailableAmount, calculateOptimisticBalances } from '../utils/staking';
import { prepareStakingData } from '../utils/staking';

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:8787';

export function ChoicesPage() {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  // Initialize: Select all 6 choices by default if no existing stakes
  useEffect(() => {
    if (state.balances.existingStakes.size === 0 && state.selectedChoices.size === 0) {
      console.log('✨ Choices: No existing stakes, selecting all choices by default');
      actions.setSelectedChoices(new Set(CHOICE_NAMES));
    } else if (state.balances.existingStakes.size > 0 && state.selectedChoices.size === 0) {
      // If returning with stakes, pre-select existing stake choices
      console.log('✨ Choices: Pre-selecting existing stake choices');
      actions.setSelectedChoices(new Set(state.balances.existingStakes.keys()));
    }
  }, [state.balances.existingStakes.size]);

  // Calculate available amount dynamically
  const availableAmount = calculateAvailableAmount(
    state.balances.walletBalance,
    state.balances.existingStakes,
    parseEther('100')
  );

  const handleSlayMoloch = async () => {
    if (state.selectedChoices.size === 0) {
      actions.setTransactionError('Please select at least one choice');
      return;
    }

    actions.setTransactionStatus('signing');
    actions.setTransactionError(null);

    try {
      console.log('⚔️ Choices: Starting transaction...');

      if (!state.connection.account || !state.connection.connectedAddress) {
        throw new Error('No account connected');
      }

      const account = state.connection.account;
      const address = state.connection.connectedAddress;

      // Get current transaction nonce for EIP-7702 authorization
      const txNonce = await publicClient.getTransactionCount({ address });
      console.log('⚔️ Choices: Transaction nonce:', txNonce);

      // Sign authorization
      console.log('⚔️ Choices: Requesting authorization signature...');
      if (!('signAuthorization' in account) || !account.signAuthorization) {
        throw new Error('Account does not support signAuthorization');
      }

      const authorization = await account.signAuthorization!({
        address: CONTRACTS.stakerWallet,
        chainId: optimismSepolia.id,
        nonce: txNonce,
      });

      console.log('⚔️ Choices: Authorization signed');

      actions.setTransactionStatus('submitting');

      // Prepare staking data
      const stakingData = prepareStakingData(
        state.selectedChoices,
        state.balances.existingStakes,
        availableAmount
      );

      console.log('⚔️ Choices: Staking data:', stakingData);

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
        operation: stakingData.operation,
        ...(stakingData.operation === 'addStakes'
          ? {
              choiceIds: stakingData.choiceIds,
              amounts: stakingData.amounts,
            }
          : {
              oldChoiceIds: stakingData.oldChoiceIds,
              oldAmounts: stakingData.oldAmounts,
              newChoiceIds: stakingData.newChoiceIds,
              newAmounts: stakingData.newAmounts,
            }),
      };

      console.log('⚔️ Choices: Submitting to relayer...');
      const response = await fetch(`${RELAYER_URL}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relayPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      console.log('⚔️ Choices: Transaction submitted!', result.txHash);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result.txHash,
      });

      console.log('⚔️ Choices: Transaction confirmed!', {
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
      });

      // Optimistically update balances based on what we just staked
      console.log('⚔️ Choices: Calculating optimistic balances...');
      const optimisticBalances = calculateOptimisticBalances(
        stakingData,
        state.balances.walletBalance,
        state.balances.existingStakes
      );
      actions.setBalances(optimisticBalances);
      console.log('⚔️ Choices: Balances updated (optimistic):', {
        wallet: optimisticBalances.walletBalance.toString(),
        stakes: optimisticBalances.existingStakes.size,
      });

      // Navigate immediately - no need to wait for chain state
      actions.setTransactionHash(result.txHash);
      actions.resetTransaction();
      navigate('/slain');
    } catch (err) {
      console.error('⚔️ Choices: Transaction failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      actions.setTransactionError(errorMessage);
      actions.setTransactionStatus('error');
    }
  };

  const handleRunAway = () => {
    console.log('⚔️ Choices: Running away to withdraw page');
    navigate('/withdraw');
  };

  const handleCloseTransactionStatus = () => {
    actions.resetTransaction();
  };

  // If transaction is in progress, show transaction status instead of choices
  if (state.transaction.status !== 'idle') {
    return (
      <TransactionStatus
        status={state.transaction.status}
        error={state.transaction.error}
        onClose={handleCloseTransactionStatus}
      />
    );
  }

  // Normal choices card with controlled state
  return (
    <PageWrapper>
      <ChoicesCard
        onSlayMoloch={handleSlayMoloch}
        onRunAway={handleRunAway}
        selectedChoices={state.selectedChoices}
        onToggleChoice={actions.toggleChoice}
      />
    </PageWrapper>
  );
}

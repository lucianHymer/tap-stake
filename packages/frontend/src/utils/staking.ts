import { CHOICE_ID_MAPPING } from './balances';

/**
 * Prepare staking data for relayer submission
 * Determines whether to use addStakes or updateStakes based on existing stakes
 */
export function prepareStakingData(
  selectedChoices: Set<string>,
  existingStakes: Map<string, bigint>,
  availableAmount: bigint
): {
  operation: 'addStakes' | 'updateStakes';
  choiceIds?: string[];
  amounts?: string[];
  oldChoiceIds?: string[];
  oldAmounts?: string[];
  newChoiceIds?: string[];
  newAmounts?: string[];
} {
  const selectedCount = selectedChoices.size;
  if (selectedCount === 0) {
    throw new Error('No choices selected');
  }

  // Calculate amount per choice (evenly distributed)
  const amountPerChoice = availableAmount / BigInt(selectedCount);
  const hasExistingStakes = existingStakes.size > 0;

  if (!hasExistingStakes) {
    // First time staking - use addStakes
    console.log('📊 Preparing addStakes operation');
    return {
      operation: 'addStakes',
      choiceIds: Array.from(selectedChoices).map((c) => CHOICE_ID_MAPPING[c]),
      amounts: Array(selectedCount).fill(amountPerChoice.toString()),
    };
  }

  // Update existing stakes - use updateStakes
  console.log('📊 Preparing updateStakes operation');
  const oldChoiceIds = Array.from(existingStakes.keys()).map((c) => CHOICE_ID_MAPPING[c]);
  const oldAmounts = Array.from(existingStakes.values()).map((a) => a.toString());

  const newChoiceIds = Array.from(selectedChoices).map((c) => CHOICE_ID_MAPPING[c]);
  const newAmounts = Array(selectedCount).fill(amountPerChoice.toString());

  return {
    operation: 'updateStakes',
    oldChoiceIds,
    oldAmounts,
    newChoiceIds,
    newAmounts,
  };
}

/**
 * Calculate total holdings (wallet + stakes)
 */
export function calculateTotalHoldings(
  walletBalance: bigint,
  existingStakes: Map<string, bigint>
): bigint {
  const totalStaked = Array.from(existingStakes.values()).reduce((sum, amount) => sum + amount, 0n);
  return walletBalance + totalStaked;
}

/**
 * Calculate available amount for staking
 * This is min(wallet + stakes, 100 GTC)
 */
export function calculateAvailableAmount(
  walletBalance: bigint,
  existingStakes: Map<string, bigint>,
  maxAmount: bigint
): bigint {
  const total = calculateTotalHoldings(walletBalance, existingStakes);
  return total > maxAmount ? maxAmount : total;
}

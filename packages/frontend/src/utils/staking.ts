import { CHOICE_ID_MAPPING } from "./balances";

/**
 * Prepare staking data for relayer submission
 * Determines whether to use addStakes or updateStakes based on existing stakes
 */
export function prepareStakingData(
  selectedChoices: Set<string>,
  existingStakes: Map<string, bigint>,
  availableAmount: bigint,
): {
  operation: "addStakes" | "updateStakes";
  choiceIds?: string[];
  amounts?: string[];
  oldChoiceIds?: string[];
  oldAmounts?: string[];
  newChoiceIds?: string[];
  newAmounts?: string[];
} {
  const selectedCount = selectedChoices.size;
  if (selectedCount === 0) {
    throw new Error("No choices selected");
  }

  // Calculate amount per choice (evenly distributed)
  const amountPerChoice = availableAmount / BigInt(selectedCount);
  console.log("📊 prepareStakingData:", {
    availableAmount: availableAmount.toString(),
    selectedCount,
    amountPerChoice: amountPerChoice.toString(),
    totalToStake: (amountPerChoice * BigInt(selectedCount)).toString(),
    dust: (
      availableAmount -
      amountPerChoice * BigInt(selectedCount)
    ).toString(),
  });
  const hasExistingStakes = existingStakes.size > 0;

  if (!hasExistingStakes) {
    // First time staking - use addStakes
    console.log("📊 Preparing addStakes operation");
    return {
      operation: "addStakes",
      choiceIds: Array.from(selectedChoices).map((c) => CHOICE_ID_MAPPING[c]),
      amounts: Array(selectedCount).fill(amountPerChoice.toString()),
    };
  }

  // Update existing stakes - use updateStakes
  console.log("📊 Preparing updateStakes operation");
  const oldChoiceIds = Array.from(existingStakes.keys()).map(
    (c) => CHOICE_ID_MAPPING[c],
  );
  const oldAmounts = Array.from(existingStakes.values()).map((a) =>
    a.toString(),
  );

  const newChoiceIds = Array.from(selectedChoices).map(
    (c) => CHOICE_ID_MAPPING[c],
  );
  const newAmounts = Array(selectedCount).fill(amountPerChoice.toString());

  return {
    operation: "updateStakes",
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
  existingStakes: Map<string, bigint>,
): bigint {
  const totalStaked = Array.from(existingStakes.values()).reduce(
    (sum, amount) => sum + amount,
    0n,
  );
  return walletBalance + totalStaked;
}

/**
 * Calculate available amount for staking
 * This is min(wallet + stakes, 100 GTC)
 */
export function calculateAvailableAmount(
  walletBalance: bigint,
  existingStakes: Map<string, bigint>,
  maxAmount: bigint,
): bigint {
  const total = calculateTotalHoldings(walletBalance, existingStakes);
  return total > maxAmount ? maxAmount : total;
}

/**
 * Calculate optimistic balances after a successful staking transaction
 * This allows immediate UI updates without waiting for chain reads
 */
export function calculateOptimisticBalances(
  stakingData: ReturnType<typeof prepareStakingData>,
  currentWalletBalance: bigint,
  currentStakes: Map<string, bigint>,
): { walletBalance: bigint; existingStakes: Map<string, bigint> } {
  // Reverse the CHOICE_ID_MAPPING to map back from IDs to names
  const ID_TO_CHOICE_NAME: Record<string, string> = {};
  for (const [name, id] of Object.entries(CHOICE_ID_MAPPING)) {
    ID_TO_CHOICE_NAME[id] = name;
  }

  if (stakingData.operation === "addStakes") {
    // First time staking: deduct from wallet, add to stakes
    const amounts = stakingData.amounts ?? [];
    const choiceIds = stakingData.choiceIds ?? [];

    const totalStaked = amounts.reduce(
      (sum, amt) => sum + BigInt(amt),
      0n,
    );
    const newWalletBalance = currentWalletBalance - totalStaked;

    const newStakes = new Map(currentStakes);
    choiceIds.forEach((choiceId, i) => {
      const choiceName = ID_TO_CHOICE_NAME[choiceId];
      const amount = BigInt(amounts[i]);
      newStakes.set(choiceName, (newStakes.get(choiceName) || 0n) + amount);
    });

    return {
      walletBalance: newWalletBalance,
      existingStakes: newStakes,
    };
  }
  // updateStakes: unstakes all, then stakes new amounts
  // Calculate total available and dust remainder
  const newAmounts = stakingData.newAmounts ?? [];
  const newChoiceIds = stakingData.newChoiceIds ?? [];

  const totalAvailable =
    currentWalletBalance +
    Array.from(currentStakes.values()).reduce((sum, amt) => sum + amt, 0n);
  const totalStaked = newAmounts.reduce(
    (sum, amt) => sum + BigInt(amt),
    0n,
  );
  const dustRemainder = totalAvailable - totalStaked;

  console.log("📊 calculateOptimisticBalances (updateStakes):", {
    currentWallet: currentWalletBalance.toString(),
    currentStakes: Array.from(currentStakes.values()).map((v) => v.toString()),
    totalAvailable: totalAvailable.toString(),
    totalStaked: totalStaked.toString(),
    dustRemainder: dustRemainder.toString(),
  });

  const newStakes = new Map<string, bigint>();
  newChoiceIds.forEach((choiceId, i) => {
    const choiceName = ID_TO_CHOICE_NAME[choiceId];
    const amount = BigInt(newAmounts[i]);
    newStakes.set(choiceName, amount);
  });

  return {
    walletBalance: dustRemainder,
    existingStakes: newStakes,
  };
}

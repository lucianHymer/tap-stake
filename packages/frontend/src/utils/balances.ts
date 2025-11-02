import type { Address, PublicClient } from "viem";
import { CONTRACTS } from "../config/contracts";

// ERC20 ABI - just balanceOf for reading wallet balance
export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
] as const;

// ERC6909 ABI - balanceOf with id parameter for reading stake positions
export const ERC6909_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
] as const;

// Choice ID mapping - maps choice names to their deterministic IDs in the contract
export const CHOICE_ID_MAPPING: Record<string, string> = {
  giveth:
    "99921030434853126453340568019546123113290951926625281747676119336391366179676",
  karma:
    "103467882007752256716465905423493267637639752828754828952501832282292424221652",
  gardens:
    "37022085098767960322629082668856854414683424180269164484809959024879061362464",
  deepfunding:
    "102590855234691522285546861392190170000582855349844279089213381909182907084793",
  privote:
    "113654052384035540339254108331114608443394203971279322386708763587320017623119",
  silvi:
    "26590924299719391955823896655943307388838177793986195267126087681677919884365",
} as const;

// All choice names in order
export const CHOICE_NAMES = [
  "giveth",
  "karma",
  "gardens",
  "deepfunding",
  "privote",
  "silvi",
] as const;

export type ChoiceName = (typeof CHOICE_NAMES)[number];

/**
 * Check wallet balance and all stake positions for an address
 * Returns wallet balance and map of choice names to stake amounts
 */
export async function checkBalances(
  publicClient: PublicClient,
  address: Address,
): Promise<{
  walletBalance: bigint;
  existingStakes: Map<string, bigint>;
}> {
  console.log("💰 Checking balances for:", address);

  // Check wallet balance (ERC20)
  const walletBalance = await publicClient.readContract({
    address: CONTRACTS.testToken,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  });

  console.log("💰 Wallet balance:", walletBalance.toString());

  // Check all 6 stake positions (ERC6909)
  const existingStakes = new Map<string, bigint>();

  for (const choiceName of CHOICE_NAMES) {
    const choiceId = CHOICE_ID_MAPPING[choiceName];
    const balance = await publicClient.readContract({
      address: CONTRACTS.stakeChoicesToken,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [address, BigInt(choiceId)],
    });

    if (balance > 0n) {
      existingStakes.set(choiceName, balance);
      console.log(`💰 Stake on ${choiceName}:`, balance.toString());
    }
  }

  console.log("💰 Total existing stakes:", existingStakes.size);

  return { walletBalance, existingStakes };
}

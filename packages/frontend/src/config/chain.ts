import { optimism, optimismSepolia } from "viem/chains";
import type { Chain } from "viem/chains";

/**
 * Centralized chain configuration
 * Single source of truth for chain selection across the app
 */

// Read chain ID from environment variable
// 11155420 = Optimism Sepolia (testnet, default)
// 10 = Optimism Mainnet
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || "11155420");

// Select the appropriate chain object
export const CHAIN: Chain = CHAIN_ID === 10 ? optimism : optimismSepolia;

// Type-safe chain name
export const CHAIN_NAME = CHAIN_ID === 10 ? "Optimism Mainnet" : "Optimism Sepolia";

// Block explorer URL base
export const BLOCK_EXPLORER_URL =
  CHAIN_ID === 10
    ? "https://optimistic.etherscan.io"
    : "https://sepolia-optimism.etherscan.io";

// Helper to get block explorer URL for an address
export function getExplorerUrl(address: string): string {
  return `${BLOCK_EXPLORER_URL}/address/${address}`;
}

// Helper to get block explorer URL for a transaction
export function getTxExplorerUrl(txHash: string): string {
  return `${BLOCK_EXPLORER_URL}/tx/${txHash}`;
}

// Re-export chain objects for convenience
export { optimism, optimismSepolia };

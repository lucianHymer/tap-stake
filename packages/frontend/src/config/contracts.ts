import type { Address } from 'viem';

/**
 * Deployed contract addresses on Optimism Sepolia
 * Last updated: October 31, 2025
 */
export const CONTRACTS = {
  testToken: '0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756' as Address,
  stakeChoicesToken: '0xb0a727f57841910752F0f1ef96871Cc28C086012' as Address,
  stakerWallet: '0x0568033352086AD7Bc23B218D8b9ff6733BA4448' as Address,
} as const;

/**
 * StakerWallet ABI
 * Contract for gasless staking via EIP-7702 delegation
 * Includes new functions: updateStakes, withdraw, unstakeAllAndWithdraw
 */
export const STAKER_WALLET_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_token', type: 'address', internalType: 'address' },
      { name: '_stakeChoicesAddress', type: 'address', internalType: 'address' },
      { name: '_relayer', type: 'address', internalType: 'address' },
      { name: '_maxAmountPerTx', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addStakes',
    inputs: [
      { name: 'choiceIds', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'maxAmountPerTx',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'relayer',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'removeStakes',
    inputs: [
      { name: 'choiceIds', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'stakeChoicesAddress',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenAddress',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'unstakeAllAndWithdraw',
    inputs: [
      { name: 'choiceIds', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'recipient', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateStakes',
    inputs: [
      { name: 'oldChoiceIds', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'oldAmounts', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'newChoiceIds', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'newAmounts', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'recipient', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    name: 'AmountTooHigh',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OnlyRelayer',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
  },
  {
    type: 'error',
    name: 'ZeroAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ZeroBalance',
    inputs: [],
  },
] as const;

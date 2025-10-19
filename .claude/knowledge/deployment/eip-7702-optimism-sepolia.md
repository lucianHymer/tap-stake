# EIP-7702 Deployment on Optimism Sepolia

## Overview
Deployment configuration and process for EIP-7702 contracts on Optimism Sepolia testnet, where EIP-7702 is already live (unlike Ethereum mainnet which gets it May 2025).

## Environment Configuration
Required environment variables:
- **PRIVATE_KEY**: Deployer's private key
- **OPTIMISM_SEPOLIA_RPC_URL**: https://sepolia.optimism.io
- **ETHERSCAN_API_KEY**: For contract verification

## Deployment Command
```bash
forge script script/Deploy.s.sol --rpc-url optimism_sepolia --broadcast --verify
```

## Deployed Contracts
The deployment creates four contracts:
1. **SelfBatchExecutor**: Generic delegation implementation for EIP-7702 (renamed from BatchExecutor)
2. **TestERC20**: Test token with public mint() function
3. **Stake**: Example contract requiring token approval
4. **StakerWallet**: Gasless staking implementation with EIP-712 signatures (NEW)

## Benefits
This setup enables single-transaction approve+stake operations, reducing gas costs by ~40% compared to traditional two-transaction patterns.

## Network Availability
EIP-7702 is live on:
- Some OP-Stack chains (Base, Optimism, Zora)
- BSC Mainnet
- Ethereum testnets (Sepolia, Holesky)
- Scheduled for Ethereum mainnet: May 7, 2025

## Latest Deployment (September 30, 2025)
Successfully deployed all contracts to Optimism Sepolia (Chain ID: 11155420):

### Contract Addresses
- **SelfBatchExecutor**: 0x7Edd1EBd251eE6D943Ae64A20969Cf40a1aa236C
- **TestERC20**: 0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649
- **Stake**: 0x334559433296D9Dd9a861c200aFB1FEAF77388AA
- **StakerWallet**: 0xB9f60eb68B55396CEb1a0a347aEfA48AE6473F33 (NEW - gasless staking)

### Deployment Stats
- Gas used: ~2,318,835
- Total cost: ~0.00000232 ETH

### Frontend Updates
Contract addresses updated in:
- packages/frontend/src/pages/EIP7702Experimental.tsx
- packages/frontend/src/pages/EIP7702NFC.tsx
- packages/frontend/src/pages/EIP7702Relayed.tsx

**Note**: Contract verification failed due to API key issue but contracts are functional on-chain.

**Related files**: packages/contracts/foundry.toml, packages/contracts/script/Deploy.s.sol, packages/contracts/DEPLOYMENT.md, packages/contracts/DEPLOYED_ADDRESSES.md
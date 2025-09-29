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
The deployment creates three contracts:
1. **BatchExecutor**: Delegation implementation for EIP-7702
2. **TestERC20**: Test token with public mint() function
3. **Stake**: Example contract requiring token approval

## Benefits
This setup enables single-transaction approve+stake operations, reducing gas costs by ~40% compared to traditional two-transaction patterns.

## Network Availability
EIP-7702 is live on:
- Some OP-Stack chains (Base, Optimism, Zora)
- BSC Mainnet
- Ethereum testnets (Sepolia, Holesky)
- Scheduled for Ethereum mainnet: May 7, 2025

**Related files**: packages/contracts/foundry.toml, packages/contracts/script/Deploy.s.sol, packages/contracts/DEPLOYMENT.md
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

## Latest Deployment (October 31, 2025)
Successfully deployed updated contracts to Optimism Sepolia (Chain ID: 11155420):

### Contract Addresses
- **SelfBatchExecutor**: 0x7Edd1EBd251eE6D943Ae64A20969Cf40a1aa236C
- **TestERC20**: 0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756
- **StakerWallet**: 0x0568033352086AD7Bc23B218D8b9ff6733BA4448 (gasless staking with restaking support)
- **StakeChoicesERC6909**: 0xb0a727f57841910752F0f1ef96871Cc28C086012 (multi-position staking)

### Relayer Configuration
The relayer has been configured with the latest deployed addresses:
- **ALLOWED_CONTRACT_ADDRESS**: StakerWallet (0x0568033352086AD7Bc23B218D8b9ff6733BA4448)
- **TOKEN_ADDRESS**: TestERC20 (0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756)
- **STAKE_CHOICES_ADDRESS**: StakeChoicesERC6909 (0xb0a727f57841910752F0f1ef96871Cc28C086012)
- **Minimum holdings requirement**: 90 tokens (90e18 wei)

### Supported Operations
The relayer supports 4 gasless operations:
1. **addStakes**: Add new stake positions
2. **updateStakes**: Update existing stake positions
3. **withdraw**: Withdraw tokens from the wallet
4. **unstakeAllAndWithdraw**: Unstake all positions and withdraw

All operations require users to have at least 90 tokens (wallet + staked balances combined).

### Frontend Updates
Contract addresses updated in:
- packages/frontend/src/pages/EIP7702Experimental.tsx
- packages/frontend/src/pages/EIP7702NFC.tsx
- packages/frontend/src/pages/EIP7702Relayed.tsx
- packages/relayer/wrangler.toml

**Related files**: packages/contracts/foundry.toml, packages/contracts/script/Deploy.s.sol, packages/contracts/DEPLOYMENT.md, packages/contracts/DEPLOYED_ADDRESSES.md
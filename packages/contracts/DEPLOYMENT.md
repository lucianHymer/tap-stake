# EIP-7702 Contracts Deployment Guide

## Prerequisites

1. Set up environment variables:
```bash
export PRIVATE_KEY="your-deployer-private-key"
export OPTIMISM_SEPOLIA_RPC_URL="https://sepolia.optimism.io"
export ETHERSCAN_API_KEY="your-etherscan-api-key"
```

2. Get OP Sepolia ETH from faucet:
   - https://faucet.quicknode.com/optimism/sepolia
   - https://www.alchemy.com/faucets/optimism-sepolia

## Deploy Contracts

```bash
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url optimism_sepolia --broadcast --verify
```

## Update Frontend

After deployment, update the contract addresses in `packages/frontend/src/pages/EIP7702Demo.tsx`:

```typescript
const CONTRACTS = {
  batchExecutor: '0x...' as Address,  // Replace with BatchExecutor address
  testToken: '0x...' as Address,      // Replace with TestERC20 address
  stake: '0x...' as Address           // Replace with Stake address
};
```

## Test Deployment

1. Run the frontend:
```bash
npm run dev
```

2. Navigate to http://localhost:5173/eip7702

3. Test flow:
   - Connect MetaMask to OP Sepolia
   - Click "Mint Test Tokens" to get TEST tokens
   - Click "Check Balance" to verify tokens received
   - Click "Execute Batch" to test EIP-7702 functionality

## Verify on Etherscan

If automatic verification fails, manually verify:
```bash
forge verify-contract <CONTRACT_ADDRESS> src/BatchExecutor.sol:BatchExecutor --chain optimism-sepolia
```

## Troubleshooting

- **MetaMask doesn't show authorization prompt**: Update to latest MetaMask version
- **Transaction reverts**: Check contract addresses are correct
- **Insufficient funds**: Get more OP Sepolia ETH from faucet
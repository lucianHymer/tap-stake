# Mainnet Deployment Checklist

This document outlines the steps needed to switch from Optimism Sepolia (testnet) to Optimism Mainnet.

## ✅ Already Completed (DRY Refactor)

All frontend code now uses centralized chain configuration from `packages/frontend/src/config/chain.ts`. Chain selection is driven by a single environment variable: `VITE_CHAIN_ID`.

**Files updated:**
- ✅ `packages/frontend/src/config/chain.ts` - Centralized chain config
- ✅ `packages/frontend/src/config/wagmi.ts` - Dynamic chain selection
- ✅ `packages/frontend/src/pages/ChoicesPage.tsx` - Uses CHAIN from config
- ✅ `packages/frontend/src/pages/WithdrawPage.tsx` - Uses CHAIN from config
- ✅ `packages/frontend/src/pages/TestPage.tsx` - Uses CHAIN from config
- ✅ `packages/frontend/src/pages/ConnectPage.tsx` - Uses CHAIN from config
- ✅ `packages/frontend/src/pages/StatsPage.tsx` - Uses CHAIN from config
- ✅ `packages/frontend/src/components/SlainCard.tsx` - Uses getExplorerUrl from config

## 🚀 Deployment Steps

### 1. Deploy Contracts to Optimism Mainnet

**Command:**
```bash
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url optimism --broadcast --verify
```

**Environment variables needed:**
- `PRIVATE_KEY` - Deployer's private key (with mainnet ETH for gas)
- `OPTIMISM_RPC_URL` - Mainnet RPC: `https://mainnet.optimism.io`
- `ETHERSCAN_API_KEY` - For contract verification

**Expected outputs:**
- StakerWallet contract address
- TestERC20 contract address (replace with actual GTC token on mainnet)
- StakeChoicesERC6909 contract address

### 2. Update Frontend Contract Addresses

Edit `packages/frontend/src/config/contracts.ts`:
```typescript
export const CONTRACTS = {
  testToken: "0x..." as Address,  // GTC token on mainnet
  stakeChoicesToken: "0x..." as Address,  // StakeChoicesERC6909 on mainnet
  stakerWallet: "0x..." as Address,  // StakerWallet on mainnet
} as const;
```

### 3. Update Frontend Environment Variables

Edit `packages/frontend/.env`:
```bash
VITE_CHAIN_ID=10  # Change from 11155420 (Sepolia) to 10 (Mainnet)
VITE_RELAYER_URL=https://your-production-relayer.workers.dev
```

### 4. Update Relayer Configuration

Edit `packages/relayer/wrangler.toml`:
```toml
CHAIN_ID = "10"
RPC_URL = "https://mainnet.optimism.io"
ALLOWED_CONTRACT_ADDRESS = "0x..."  # StakerWallet mainnet address
TOKEN_ADDRESS = "0x..."  # GTC token mainnet address
STAKE_CHOICES_ADDRESS = "0x..."  # StakeChoicesERC6909 mainnet address
APPROVED_CHOICE_IDS = "..."  # Update if needed
MINIMUM_HOLDINGS = "90000000000000000000"  # 90 tokens minimum
```

### 5. Update Relayer Secrets

```bash
cd packages/relayer
wrangler secret put PRIVATE_KEY  # Relayer's mainnet private key (with ETH for gas)
```

### 6. Deploy Relayer to Production

```bash
cd packages/relayer
wrangler publish
```

### 7. Build and Deploy Frontend

```bash
cd packages/frontend
npm run build
# Deploy dist/ directory to your hosting service
```

## 🔍 Post-Deployment Verification

1. **Test NFC connection** - Connect with a test card and verify address appears
2. **Test minting** - Mint test tokens (or verify real GTC balance)
3. **Test staking** - Sign and submit a stake transaction via relayer
4. **Test withdrawal** - Verify unstake and withdrawal flow works
5. **Check block explorer** - Verify transactions appear on Optimism Mainnet
6. **Test stats page** - Verify it queries mainnet contracts correctly

## ⚠️ Important Notes

- **GTC Token**: On mainnet, replace TestERC20 with the actual GTC token address
  - Mainnet GTC: [Look up on Optimism block explorer]
  - Remove test minting functionality (can't mint real GTC)

- **Gas Fees**: Relayer needs sufficient mainnet ETH for gas
  - Monitor relayer wallet balance
  - Set up alerts for low balance

- **Approved Choice IDs**: Verify the choice IDs match your mainnet deployment

- **MINIMUM_HOLDINGS**: Currently set to 90 tokens - adjust if needed for mainnet

## 🔄 Rolling Back to Testnet

If you need to switch back to testnet:

```bash
# Frontend
VITE_CHAIN_ID=11155420

# Relayer
CHAIN_ID = "11155420"
RPC_URL = "https://sepolia.optimism.io"
# Revert contract addresses to testnet values
```

## 📝 Additional Configuration

Consider updating:
- `VITE_WHITEPAPER_URL` - Point to your actual whitepaper
- `APPROVED_CHOICE_IDS` - Ensure these match your governance choices
- Rate limiting on relayer (future enhancement)
- Monitoring and alerting for relayer (future enhancement)

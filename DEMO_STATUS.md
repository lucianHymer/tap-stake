# EIP-7702 Gasless Staking Demo - Status Report

**Date:** 2025-10-06
**Status:** Demo Infrastructure Complete, Authorization Issue Under Investigation

## 🎯 Project Overview

This project implements a gasless staking system using EIP-7702 delegation on Optimism Sepolia. Users can stake tokens without paying gas fees through a relayer-based architecture.

## ✅ Completed Components

### 1. Smart Contracts (Deployed on Optimism Sepolia)

All contracts are deployed and verified:

- **StakerWallet**: `0x39fe042d517031a812aBf6f2e15a2615A6c08f3f`
  - EIP-7702 delegation implementation
  - Whitelisted relayer: `0xF6c6dd3206ba67b5ebE1279d35e42691C38178c1`
  - Handles approve + stake in single transaction

- **TestERC20**: `0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649`
  - Test token for staking
  - Public `mint()` function for testing

- **Stake Contract**: `0x334559433296D9Dd9a861c200aFB1FEAF77388AA`
  - Target staking contract

- **SelfBatchExecutor**: `0x7edd1ebd251ee6d943ae64a20969cf40a1aa236c`
  - Alternative delegation implementation

### 2. Frontend Application

**Location:** `packages/frontend/`

**Tech Stack:**
- React 19 + TypeScript
- Vite 7 for build tooling
- Viem 2.37 for Ethereum interactions
- Wagmi for wallet connectivity
- React Router for navigation

**Pages Implemented:**
- `/` - NFC-based demon slayer theme (original)
- `/eip7702` - MetaMask-based EIP-7702 demo
- `/eip7702-nfc` - NFC card EIP-7702 flow
- `/eip7702-relayed` - Gasless staking with NFC
- `/demo` - **NEW: Hardcoded key demo for testing**

**Demo Page Features:**
- No NFC hardware required
- Uses hardcoded test private key
- Connects to local relayer for iteration
- Full UI with balance checks, minting, and execution buttons

### 3. Cloudflare Worker Relayer

**Location:** `packages/relayer/`

**Functionality:**
- Receives EIP-7702 authorization + operation parameters
- Verifies authorization signatures
- Submits transactions with `authorizationList`
- Pays gas fees on behalf of users
- CORS enabled for local development

**Environment Variables:**
```env
PRIVATE_KEY=0x9b30d49cb8717768631eef546522b5bc7f1f6290fd74f93ef05f4a4b7b81f265
RPC_URL=https://sepolia.optimism.io
CHAIN_ID=11155420
```

**Local Development:**
```bash
cd packages/relayer
wrangler dev --port 8787
```

### 4. Test Infrastructure

**Demo Accounts:**
- **Relayer Account**: `0xF6c6dd3206ba67b5ebE1279d35e42691C38178c1`
  - Private Key: `0x9b30d49cb8717768631eef546522b5bc7f1f6290fd74f93ef05f4a4b7b81f265`
  - Balance: 0.01 ETH on Optimism Sepolia
  - Purpose: Pays gas for relayed transactions

- **Demo User Account**: `0x39F04C8046D2C43F8024eb2626A79E840fD4676B`
  - Private Key: `0x3fbfa3f3d782abc0871054d84cd48c96837df9e401cabe652d9d90b66fcadc64`
  - Balance: 0 ETH (intentional - testing gasless flow)
  - Purpose: Signs authorizations, receives gasless transactions

### 5. Browser Automation (Playwright MCP)

**Capabilities:**
- Navigate to demo page
- Click buttons and interact with UI
- Capture screenshots at each step
- Monitor console messages and errors
- Full page snapshots for debugging

**Screenshots Captured:**
- `demo-initial.png` - Initial page load
- `demo-error-state.png` - Current authorization error state

## ⚠️ Current Issue

### Authorization Signature Verification Error

**Symptoms:**
- Frontend successfully signs EIP-7702 authorization
- Relayer receives the authorization
- `recoverAuthorizationAddress()` fails with: `TypeError: Cannot read properties of undefined (reading 'length')`

**Error Location:**
`packages/relayer/src/index.ts:153` - during authorization verification

**Root Cause:**
The viem library's `recoverAuthorizationAddress()` function is having trouble with the authorization object format, specifically when encoding to RLP. The error occurs in the RLP encoding step, suggesting a field in the authorization object is undefined or incorrectly formatted.

**Technical Details:**
```typescript
// Current authorization format sent to relayer:
{
  authorization: {
    contractAddress: "0x39fe042d...",
    chainId: 11155420,
    nonce: "0",  // String format
    r: "0x...",
    s: "0x...",
    yParity: 0 | 1
  },
  amount: "100000000000000000000"
}

// Relayer transforms to:
{
  address: contractAddress,  // viem expects 'address' field
  chainId: number,
  nonce: BigInt,  // Converted to BigInt
  r: Hex,
  s: Hex,
  yParity: number
}
```

## 🔧 How to Run Locally

### Prerequisites
- Node.js 18+
- npm or yarn
- Wrangler CLI (for Cloudflare Worker)

### Step 1: Start the Relayer
```bash
cd packages/relayer

# Install dependencies
npm install

# Start local development server
wrangler dev --port 8787 \
  --var PRIVATE_KEY:0x9b30d49cb8717768631eef546522b5bc7f1f6290fd74f93ef05f4a4b7b81f265 \
  --var RPC_URL:https://sepolia.optimism.io \
  --var CHAIN_ID:11155420
```

Relayer will be available at: `http://localhost:8787`

### Step 2: Start the Frontend
```bash
cd packages/frontend

# Install dependencies
npm install

# Start development server
npm run dev -- --port 5173 --host
```

Frontend will be available at: `http://localhost:5173/tap-stake/demo`

### Step 3: Test with Browser
1. Navigate to `http://localhost:5173/tap-stake/demo`
2. Click "Check Balances" to verify connection
3. Click "🚀 EXECUTE GASLESS STAKE" to test the flow

## 📂 Project Structure

```
packages/
├── contracts/              # Foundry smart contracts
│   ├── src/
│   │   ├── StakerWallet.sol
│   │   ├── SelfBatchExecutor.sol
│   │   ├── TestERC20.sol
│   │   └── Stake.sol
│   ├── script/Deploy.s.sol
│   └── broadcast/          # Deployment receipts
│
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Demo.tsx   # NEW: Hardcoded key demo
│   │   │   ├── EIP7702Relayed.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── nfc.ts     # NFC integration
│   │   └── App.tsx
│   └── vite.config.ts
│
└── relayer/               # Cloudflare Worker
    ├── src/
    │   └── index.ts       # Relayer logic
    ├── wrangler.toml
    └── .env               # Local environment variables
```

## 🐛 Debugging Information

### Relayer Logs
The relayer logs show the exact error:
```
Failed to verify authorization: TypeError: Cannot read properties of undefined (reading 'length')
  at getEncodableBytes (viem/utils/encoding/toRlp.ts:102:51)
  at hashAuthorization (viem/utils/authorization/hashAuthorization.ts:41:7)
  at recoverAuthorizationAddress (viem/utils/authorization/recoverAuthorizationAddress.ts:63:11)
```

### Frontend Console Logs
The frontend successfully:
1. Gets transaction nonce: `0`
2. Signs authorization with correct parameters
3. Sends payload to relayer
4. Receives 400 error response

### Working NFC Implementation
The NFC-based flow (`/eip7702-relayed`) has the same architecture but uses live NFC cards. The authorization signing works correctly with NFC, suggesting the issue is specific to how the hardcoded demo constructs the authorization object.

## 🚀 Next Steps for Resolution

### Option 1: Debug Authorization Format
1. Compare authorization object from NFC flow vs hardcoded demo
2. Log the exact authorization object before `recoverAuthorizationAddress()`
3. Check if all fields (especially `nonce`) are properly formatted

### Option 2: Simplify for Demo
1. Skip authorization verification in demo mode
2. Add a `DEMO_MODE` environment variable
3. Allow unsigned transactions for testing flow

### Option 3: Update Viem Version
1. Check if there's a version mismatch between frontend and relayer
2. Update to latest viem version with better EIP-7702 support
3. Review viem changelog for authorization-related fixes

### Option 4: Use Alternative Verification
1. Implement custom signature recovery instead of viem's helper
2. Manually construct the authorization hash
3. Use `ecrecover` or `recoverAddress` directly

## 📊 Testing Checklist

- [x] Smart contracts deployed and verified
- [x] Frontend demo page created
- [x] Local relayer running
- [x] Playwright automation working
- [x] UI interactions functional
- [ ] Authorization signature verification
- [ ] End-to-end gasless transaction
- [ ] Balance updates after staking
- [ ] Error handling and retry logic

## 📝 Additional Notes

### EIP-7702 Compatibility
- Optimism Sepolia has EIP-7702 enabled
- Contracts are designed for delegation pattern
- Frontend uses viem's experimental EIP-7702 APIs

### Security Considerations
- Demo uses test keys only (publicly disclosed)
- Relayer is whitelisted in StakerWallet contract
- Maximum stake amount enforced: 1000 tokens
- Nonce-based replay protection (not yet tested)

### Known Limitations
1. Demo account has no ETH (can't mint tokens without relayer)
2. SSL disabled in vite config for Playwright compatibility
3. Multiple background bash processes may need cleanup
4. Authorization format requires investigation

## 🔗 Useful Links

- **Optimism Sepolia Explorer**: https://sepolia-optimism.etherscan.io/
- **StakerWallet Contract**: https://sepolia-optimism.etherscan.io/address/0x39fe042d517031a812aBf6f2e15a2615A6c08f3f
- **Test Token Contract**: https://sepolia-optimism.etherscan.io/address/0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649
- **Viem EIP-7702 Docs**: https://viem.sh/experimental/eip7702

## 👥 Handoff Checklist

For the next team member:
- [ ] Review this document
- [ ] Verify local relayer starts successfully
- [ ] Verify frontend loads at http://localhost:5173/tap-stake/demo
- [ ] Understand the authorization error from logs
- [ ] Check viem versions in both frontend and relayer
- [ ] Test authorization object format
- [ ] Consider implementing one of the resolution options above

---

**Contact:** See git history for previous contributors
**Last Updated:** 2025-10-06
**Priority:** High - Authorization verification blocking demo
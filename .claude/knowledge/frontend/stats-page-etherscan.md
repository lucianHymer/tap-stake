# Stats Page with Client-Side Etherscan API Queries

## Overview
Implemented StatsPage.tsx that queries relayer activity and ERC6909 token totals entirely client-side using Etherscan API.

## Architecture
- **User provides API key**: Stored in localStorage for privacy
- **Direct browser queries**: https://api.etherscan.io/v2/api
- **No backend changes**: No relayer modifications needed
- **Works with any ERC20**: USDC, GTC, etc.

## Key Features

### 1. Withdrawal Tracking
- Queries relayer address for all transactions
- Filters by function selectors:
  - `0x51cff8d9` (withdraw)
  - `0x321c2d4b` (unstakeAllAndWithdraw)
- Filters successful only: `txreceipt_status === '1' && isError === '0'`

### 2. ERC6909 TotalSupply Queries
- Queries totalSupply for all 6 choice tokens
- Estimates stakers: `totalSupply / 100`, rounded UP to nearest tenth

### 3. Pagination Support
Handles large transaction counts with automatic pagination:
- Uses page and offset parameters (max 10,000 records per request)
- Loops through all pages automatically until no more results
- Handles errors gracefully
- No transaction count limit

```typescript
async function fetchAllTransactions(apiKey: string): Promise<any[]> {
  const allTxs: any[] = [];
  let page = 1;
  const offset = 10000; // Max per page

  while (true) {
    // Fetch page
    // Break if: status !== "1", no results, or results < offset
    page++;
  }
  return allTxs;
}
```

## Benefits
- **No secrets in Worker**: User controls their own API key
- **Better privacy**: User data not exposed to relayer
- **No rate limit sharing**: Each user uses their own quota
- **Free API key**: https://etherscan.io/apis

## Chain Configuration
Page is chain-aware and dynamically configures based on environment:
- Uses `VITE_CHAIN_ID` to determine network (11155420 = OP Sepolia, 10 = OP Mainnet)
- Fetches relayer address from `StakerWallet.relayer()` on mount
- Automatically selects correct Etherscan API endpoint
- Displays current chain name and ID

## UI Display
Shows:
- Current chain name and ID
- Relayer address (truncated)
- Total withdrawals count
- Unique withdrawers count
- ERC6909 token supplies and estimated stakers

**Related files**: packages/frontend/src/pages/StatsPage.tsx, packages/frontend/src/pages/StatsPage.module.css, packages/frontend/src/App.tsx

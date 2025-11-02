# Relayer Test Mint Endpoint

## Overview
Added /test-mint endpoint to the EIP-7702 relayer for easy TestERC20 token minting during testing.

## Key Features
- **POST /test-mint** endpoint accepts `{ address, amount }` in JSON
- **Chain restriction**: Only works on Optimism Sepolia (chain ID 11155420) - returns 403 on other chains
- Uses relayer's wallet (PRIVATE_KEY from env) to call mint() on TestERC20 contract
- Amount must be > 0 and provided as string (wei)
- Returns transaction hash and mint details on success
- Useful for creating test tokens for new wallets/accounts without manual token management

## Implementation Details
- Added mint() function to ERC20_ABI with `(address to, uint256 amount)` signature
- Created handleTestMint() function for endpoint logic
- Added URL routing in main fetch handler to route /test-mint requests
- Chain ID validation happens before any wallet operations
- Uses same error handling pattern as main relay endpoint

## Example Usage
```typescript
await fetch(RELAYER_URL + '/test-mint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    amount: parseEther('100').toString(),
  }),
});
```

**Related files**: packages/relayer/src/index.ts, packages/relayer/README.md, packages/relayer/TEST_MINT_EXAMPLE.md

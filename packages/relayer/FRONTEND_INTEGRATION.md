# Frontend Integration Guide - Switching to Relayer

This guide explains how to modify the frontend to use the relayer service instead of submitting EIP-7702 transactions directly.

## Current Implementation

The frontend currently handles the full transaction flow:
1. Signs authorization with NFC
2. Creates wallet client
3. Submits transaction with authorizationList directly to chain
4. User pays gas

**Files to modify:**
- `packages/frontend/src/pages/EIP7702NFC.tsx`
- `packages/frontend/src/pages/EIP7702Experimental.tsx`

## Required Changes

### 1. Add Relayer URL Configuration

Add to `.env` or configuration:
```
VITE_RELAYER_URL=http://localhost:8787  # Local development
# or
VITE_RELAYER_URL=https://eip7702-relayer.your-domain.workers.dev  # Production
```

### 2. Replace Transaction Submission Logic

#### Current Code (in EIP7702NFC.tsx)
```typescript
// After signing authorization...
const txHash = await walletClient.sendTransaction({
  to: nfcAccount.address,
  authorizationList: [authorization],
  data: encodeFunctionData({
    abi: batchExecutorABI,
    functionName: 'executeBatch',
    args: [calls],
  }),
});
```

#### New Code (Using Relayer)
```typescript
// After signing authorization...
const relayerUrl = import.meta.env.VITE_RELAYER_URL || 'http://localhost:8787';

const response = await fetch(`${relayerUrl}/relay`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    authorization: {
      contractAddress: authorization.contractAddress,
      chainId: authorization.chainId,
      nonce: authorization.nonce.toString(), // Convert BigInt to string
      r: authorization.r,
      s: authorization.s,
      yParity: authorization.yParity,
    },
    to: nfcAccount.address,
    data: encodeFunctionData({
      abi: batchExecutorABI,
      functionName: 'executeBatch',
      args: [calls],
    }),
    value: "0", // Optional, default is 0
  }),
});

const result = await response.json();

if (!result.success) {
  throw new Error(result.error || 'Relay failed');
}

const txHash = result.txHash;
```

### 3. Remove Wallet Client Requirement

Since the relayer handles transaction submission, you no longer need:
- MetaMask or wallet connection for gas payment
- `walletClient` for sending transactions
- User to have ETH for gas

Keep only:
- `publicClient` for reading chain state
- NFC account for signing authorizations

### 4. Update UI/UX

#### Remove
- "Connect wallet" step for gas payment
- Gas balance checks
- Network switching for wallet

#### Add
- Relayer status indicator (optional)
- Different error handling for relayer failures

### 5. Error Handling Updates

```typescript
try {
  const response = await fetch(`${relayerUrl}/relay`, ...);

  if (!response.ok) {
    // Handle HTTP errors
    const error = await response.json();
    console.error('Relayer error details:', error.details);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    // Handle relayer-specific errors
    console.error('Transaction failed:', result.details);
    throw new Error(result.error);
  }

  // Success!
  setTxHash(result.txHash);

} catch (error) {
  if (error.message.includes('Chain ID mismatch')) {
    // Handle chain mismatch
  } else if (error.message.includes('fetch')) {
    // Handle network/connectivity issues
    alert('Relayer service unavailable');
  } else {
    // Handle other errors
  }
}
```

## Benefits After Migration

1. **True gasless experience** - Users never need ETH
2. **Single NFC tap** - No wallet connection needed
3. **Simpler UX** - Remove wallet management complexity
4. **Mobile friendly** - Works without MetaMask mobile

## Testing the Integration

1. **Local Testing**
   ```bash
   # Terminal 1: Start relayer
   cd packages/relayer
   npm run dev

   # Terminal 2: Start frontend
   cd packages/frontend
   npm run dev
   ```

2. **Verify Flow**
   - Tap NFC to sign authorization
   - Check relayer logs for transaction
   - Verify transaction on Etherscan

3. **Production Deployment**
   ```bash
   # Deploy relayer
   cd packages/relayer
   npm run deploy

   # Update frontend .env
   VITE_RELAYER_URL=https://your-worker.workers.dev
   ```

## Security Considerations

1. **Current Implementation** (for POC)
   - Open CORS (accepts all origins)
   - No rate limiting
   - No access control

2. **Before Production**
   - Restrict CORS to your domain
   - Add rate limiting per address
   - Implement allowlist for authorized addresses
   - Add request signing/authentication
   - Monitor relayer wallet balance

## Example Complete Integration

See `packages/frontend/src/pages/EIP7702Relayed.tsx` (to be created) for a complete example of the relayer integration pattern.
# Centralized Chain Configuration

## Overview
Refactored entire frontend to use centralized chain configuration driven by `VITE_CHAIN_ID` environment variable.

## Implementation
Created `packages/frontend/src/config/chain.ts` as single source of truth:

```typescript
// Reads VITE_CHAIN_ID (11155420 = OP Sepolia, 10 = OP Mainnet)
export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID || 11155420;
export const CHAIN = CHAIN_ID === 10 ? optimism : optimismSepolia;
export const CHAIN_NAME = CHAIN.name;
export const BLOCK_EXPLORER_URL = CHAIN.blockExplorers.default.url;

// Helper functions
export function getExplorerUrl(address: string): string;
export function getTxExplorerUrl(txHash: string): string;
```

## Migration
Removed all hardcoded chain references from:
- **wagmi.ts**: Uses CHAIN for dynamic chain selection
- **ChoicesPage, WithdrawPage, TestPage, ConnectPage**: All use CHAIN from config
- **StatsPage**: Removed local CHAIN_ID/CHAIN definitions
- **SlainCard**: Removed local getExplorerUrl function

## Benefits
- **DRY principle**: Single source of truth for chain config
- **Easy network switching**: Change one env var to switch networks
- **Consistent behavior**: All pages use same chain config
- **Easy mainnet deployment**: Simple migration path

## Mainnet Switch Process
1. Change `VITE_CHAIN_ID=10` in .env
2. Deploy contracts to OP Mainnet
3. Update contract addresses in contracts.ts
4. Full checklist in MAINNET_DEPLOYMENT.md

**Related files**: packages/frontend/src/config/chain.ts, packages/frontend/src/config/wagmi.ts, packages/frontend/src/pages/ChoicesPage.tsx, packages/frontend/src/pages/WithdrawPage.tsx, packages/frontend/src/pages/TestPage.tsx, packages/frontend/src/pages/ConnectPage.tsx, packages/frontend/src/pages/StatsPage.tsx, packages/frontend/src/components/SlainCard.tsx

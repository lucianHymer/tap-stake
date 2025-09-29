# EIP-7702 Viem Client Integration

## Overview
Integration pattern for using viem with EIP-7702 delegation features on supported chains like Optimism Sepolia.

## Client Setup
The EIP7702Demo component uses separate viem clients:
- **walletClient**: For transactions and signing operations
- **publicClient**: For reading blockchain state

## TypeScript Compatibility
Viem's TypeScript types don't yet fully support EIP-7702's new methods, requiring @ts-ignore comments for:
- `signAuthorization()` method
- `authorizationList` field in transaction parameters

## Transaction Flow
1. **Sign Authorization**: User signs authorization for BatchExecutor contract delegation
2. **Encode Batch Data**: Prepare executeBatch() call data with multiple operations
3. **Send Transaction**: Execute transaction to self (EOA) with authorizationList, allowing delegated execution

## Contract Address Management
After deployment, must update three addresses in the CONTRACTS object:
- `batchExecutor`: The delegation implementation contract
- `testToken`: ERC20 token for testing
- `stake`: Target contract requiring token approval

This pattern enables single-transaction approve+stake operations through EIP-7702 delegation.

**Related files**: packages/frontend/src/pages/EIP7702Demo.tsx
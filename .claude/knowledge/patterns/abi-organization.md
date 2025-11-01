# ABI Organization Pattern

## Overview
Pattern for organizing ABIs when test contracts have additional functions beyond standard interfaces.

## Implementation
- **Keep standard interface ABIs clean**: e.g., ERC20_ABI with only balanceOf
- **Create test-specific ABIs**: Extend standard ones using spread operator
- `TEST_ERC20_ABI = [...ERC20_ABI, { mint function }]`
- Use appropriate ABI for each context:
  - ERC20_ABI for balance checks
  - TEST_ERC20_ABI for test mint endpoint

## Benefits
- Clear separation between standard and test-only functionality
- Standard ABI remains minimal and accurate to the spec
- Test ABI explicitly shows it extends standard functionality
- TypeScript type safety maintained for both

## Example
```typescript
const ERC20_ABI = [
  { name: 'balanceOf', ... },
] as const;

const TEST_ERC20_ABI = [
  ...ERC20_ABI,
  { name: 'mint', ... },  // Test-only function
] as const;

// Use ERC20_ABI for standard operations
await publicClient.readContract({
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  ...
});

// Use TEST_ERC20_ABI for test operations
await walletClient.writeContract({
  abi: TEST_ERC20_ABI,
  functionName: 'mint',
  ...
});
```

**Related files**: packages/relayer/src/index.ts

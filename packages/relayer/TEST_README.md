# Relayer Test Suite

## Overview
Comprehensive unit tests for the EIP-7702 gasless transaction relayer. Tests focus on request validation logic without requiring blockchain integration.

## Test Coverage

### HTTP & CORS (3 tests)
- ✓ Rejects non-POST methods
- ✓ Handles OPTIONS preflight
- ✓ Includes proper CORS headers

### Required Field Validation (2 tests)
- ✓ Rejects missing authorization
- ✓ Rejects missing operation

### Operation Type Validation (2 tests)
- ✓ Rejects invalid operation types
- ✓ Accepts all valid operations (addStakes, updateStakes, withdraw, unstakeAllAndWithdraw)

### addStakes Validation (7 tests)
- ✓ Requires choiceIds and amounts
- ✓ Rejects array length mismatch
- ✓ Rejects empty arrays
- ✓ Rejects non-approved choice IDs
- ✓ Rejects zero amounts
- ✓ Enforces MAX_STAKE_PER_TX limit

### updateStakes Validation (7 tests)
- ✓ Requires newChoiceIds and newAmounts
- ✓ Validates old/new array length matches
- ✓ Rejects zero amounts (both old and new)
- ✓ Enforces MAX_STAKE_PER_TX limit for new stakes

### withdraw Validation (1 test)
- ✓ Requires recipient address

### unstakeAllAndWithdraw Validation (5 tests)
- ✓ Requires recipient, choiceIds, and amounts
- ✓ Rejects array length mismatch
- ✓ Rejects zero amounts

### Authorization Validation (2 tests)
- ✓ Rejects chain ID mismatch
- ✓ Rejects unauthorized contract addresses

### Environment Configuration (3 tests)
- ✓ Parses approved choice IDs correctly
- ✓ Handles invalid configuration gracefully
- ✓ Rejects unsupported chain IDs

## Running Tests

```bash
# Run tests once
npm test

# Watch mode (re-run on changes)
npm run test:watch

# UI mode (interactive browser interface)
npm run test:ui

# Coverage report
npm run test:coverage
```

## Test Strategy

### What We Test
- Request validation logic
- Operation-specific field requirements
- Amount and choice ID validation
- Authorization format validation
- Error response formatting

### What We Stub
- Viem wallet/public clients
- Authorization signature recovery
- Blockchain balance checks
- Transaction submission

### Why This Approach?
- **Fast**: No blockchain dependency, runs in <100ms
- **Focused**: Tests business logic, not viem internals
- **Maintainable**: Clear test cases for each validation rule
- **CI-friendly**: Deterministic, no network/RPC flakiness

## Adding New Tests

When adding new operations or validation rules:

1. Add test case to appropriate `describe` block
2. Use `createRequest()` helper for consistent request structure
3. Use `createValidAuth()` for valid authorization objects
4. Mock any new viem functions in the `vi.mock()` blocks
5. Run `npm test` to verify

## Known Limitations

These tests do **not** cover:
- Actual EIP-7702 delegation mechanics (requires real chain)
- Signature verification correctness (viem handles this)
- Real balance checking (mocked to 100 tokens)
- Transaction execution (mocked to return `0xmocktxhash`)

For end-to-end testing, deploy to Optimism Sepolia testnet and use the frontend integration tests.

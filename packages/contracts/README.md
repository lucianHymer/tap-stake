# Contracts

This package will contain the Foundry-based smart contracts for the Tap-Stake project.

## Setup

To initialize this package:

```bash
cd packages/contracts
forge init --no-commit .
```

## Planned Contracts

- `TapStakeImplementation.sol` - EIP-7702 implementation contract for delegated execution
  - `execute()` - Single call execution
  - `executeBatch()` - Batched operations

## Phase 2 Implementation

The contracts in this package will enable:
- EIP-7702 delegation from EOAs to smart contract code
- Paymaster-sponsored transactions
- Gasless transactions for NFC card holders
# Deployed Contract Addresses - Optimism Sepolia

## Deployment Date: September 30, 2025

### Network: Optimism Sepolia (Chain ID: 11155420)

| Contract | Address | Description |
|----------|---------|-------------|
| **SelfBatchExecutor** | `0x7Edd1EBd251eE6D943Ae64A20969Cf40a1aa236C` | EIP-7702 delegation contract for batch execution |
| **TestERC20** | `0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649` | Test ERC20 token with public mint function |
| **Stake** | `0x334559433296D9Dd9a861c200aFB1FEAF77388AA` | Example staking contract |
| **StakerWallet** | `0x39fe042d517031a812aBf6f2e15a2615A6c08f3f` | Gasless staking via EIP-7702 (relayer: 0x872D0Cf468Ee82cC7D6828f63DDceebb7F19eA19) |

## Deployment Transaction Details

- **Gas Used**: ~2,318,835
- **Total Cost**: ~0.00000232 ETH
- **Deployer**: Address derived from provided private key

## Key Features Deployed

### StakerWallet (NEW)
- ERC-7201 namespaced storage for safe re-delegation
- EIP-712 typed signatures for user authorization
- Nonce-based replay protection
- Gasless staking operations via relayers
- Approve exact amounts and clear after use

### SelfBatchExecutor
- Renamed from BatchExecutor for clarity
- Self-execution pattern for EIP-7702
- Batch operations in single transaction

## Frontend Integration

Update the following file with these addresses:
- `packages/frontend/src/pages/EIP7702Demo.tsx`
- `packages/frontend/src/pages/EIP7702NFC.tsx`

```typescript
const CONTRACTS = {
  batchExecutor: "0x7Edd1EBd251eE6D943Ae64A20969Cf40a1aa236C" as Address,
  testToken: "0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649" as Address,
  stake: "0x334559433296D9Dd9a861c200aFB1FEAF77388AA" as Address,
  stakerWallet: "0x39fe042d517031a812aBf6f2e15a2615A6c08f3f" as Address,
};
```

## Verification Status

⚠️ Contract verification failed due to API key issue but contracts are deployed and functional.
To manually verify later:
```bash
forge verify-contract <address> <contract_name> --chain-id 11155420 --etherscan-api-key <valid_key>
```
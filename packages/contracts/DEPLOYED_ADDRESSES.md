# Deployed Contract Addresses - Optimism Sepolia

## Latest Deployment Date: October 13, 2025

### Network: Optimism Sepolia (Chain ID: 11155420)

| Contract | Address | Description |
|----------|---------|-------------|
| **TestERC20** | `0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756` | Test ERC20 token with public mint function |
| **StakeChoicesFactory** | `0x728E319523e1Fe59CAC64f2A5814726e9e6ad0bB` | Factory for deploying StakeChoicesERC6909 sessions |
| **StakeChoicesERC6909 Implementation** | `0xfE080740a03D157Dd244199a5B9E524d7D7BAf8B` | Implementation contract for ERC6909 multi-choice staking |
| **Sample StakeChoicesERC6909 Session** | `0xb8D2655B94a007c5855d85d4bd51E07c3c47521F` | Sample session deployed via factory |
| **StakerWallet** | `0xaF0D544D654dFC34965D00177c47e7634641F2A7` | Gasless staking via EIP-7702 (relayer: 0x872D0Cf468Ee82cC7D6828f63DDceebb7F19eA19) |

## Deployment Transaction Details

- **Gas Used**: ~3,556,723
- **Total Cost**: ~0.0000035585 ETH
- **Deployer**: Address derived from provided private key

## Key Features Deployed

### StakeChoicesERC6909 System
- Multi-choice staking using ERC6909 multi-token standard
- Factory pattern for deploying new staking sessions
- Each choice is represented as a separate token ID
- Efficient staking and unstaking across multiple choices

### StakerWallet
- ERC-7201 namespaced storage for safe re-delegation
- EIP-712 typed signatures for user authorization
- Nonce-based replay protection
- Gasless staking operations via relayers
- Bound to specific StakeChoices session at deployment
- Max stake per transaction: 100 ETH

## Frontend Integration

Update the following file with these addresses:
- `packages/frontend/src/pages/EIP7702Demo.tsx`
- `packages/frontend/src/pages/EIP7702NFC.tsx`

```typescript
const CONTRACTS = {
  testToken: "0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756" as Address,
  stakeChoicesFactory: "0x728E319523e1Fe59CAC64f2A5814726e9e6ad0bB" as Address,
  stakeChoicesSession: "0xb8D2655B94a007c5855d85d4bd51E07c3c47521F" as Address,
  stakerWallet: "0xaF0D544D654dFC34965D00177c47e7634641F2A7" as Address,
};
```

## Verification Status

✅ **All contracts successfully verified on Optimism Sepolia Etherscan!**

| Contract | Verification Status | Etherscan Link |
|----------|-------------------|----------------|
| TestERC20 | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756#code) |
| StakeChoicesFactory | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0x728E319523e1Fe59CAC64f2A5814726e9e6ad0bB#code) |
| StakeChoicesERC6909 Implementation | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0xfE080740a03D157Dd244199a5B9E524d7D7BAf8B#code) |
| StakerWallet | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0xaF0D544D654dFC34965D00177c47e7634641F2A7#code) |

**Compiler Settings Used:**
- Compiler: v0.8.30+commit.73712a01
- Optimization: Enabled with 200 runs
- EVM Version: Prague

## Contract Explorer Links

- [TestERC20](https://sepolia-optimism.etherscan.io/address/0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756)
- [StakeChoicesFactory](https://sepolia-optimism.etherscan.io/address/0x728E319523e1Fe59CAC64f2A5814726e9e6ad0bB)
- [StakeChoicesERC6909 Implementation](https://sepolia-optimism.etherscan.io/address/0xfE080740a03D157Dd244199a5B9E524d7D7BAf8B)
- [Sample Session](https://sepolia-optimism.etherscan.io/address/0xb8D2655B94a007c5855d85d4bd51E07c3c47521F)
- [StakerWallet](https://sepolia-optimism.etherscan.io/address/0xaF0D544D654dFC34965D00177c47e7634641F2A7)
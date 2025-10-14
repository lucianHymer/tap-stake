# Deployed Contract Addresses - Optimism Sepolia

## Latest Deployment Date: October 14, 2025

### Network: Optimism Sepolia (Chain ID: 11155420)

| Contract | Address | Description |
|----------|---------|-------------|
| **TestERC20** | `0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756` | Test ERC20 token with public mint function |
| **StakeChoicesFactory** | `0x17FC7698A7065B41007dC270Afa4aa85313E2717` | Factory for deploying StakeChoicesERC6909 sessions |
| **StakeChoicesERC6909 Implementation** | `0x3E89aba51ede4985cb3fBef33Bc5648e2BeF16B5` | Implementation contract for ERC6909 multi-choice staking |
| **Sample StakeChoicesERC6909 MultiToken** | `0x79ed6D4B6d582286944aD6cC18cB7A61Ca5c2199` | Sample multi-token deployed via factory with 6 registered choices |
| **StakerWallet** | `0xaF0D544D654dFC34965D00177c47e7634641F2A7` | Gasless staking via EIP-7702 (relayer: 0x872D0Cf468Ee82cC7D6828f63DDceebb7F19eA19) |

## Registered Choices

The sample multi-token has 6 pre-registered choices:

| Choice | Name | Symbol | Choice ID |
|--------|------|--------|-----------|
| 1 | Staked GTC - Choice 1 | 🥩GTC-C1 | `35944569015047981758235818500518690797898803954137960285681681313226267984075` |
| 2 | Staked GTC - Choice 2 | 🥩GTC-C2 | `50183950411008508464930554686549033253140240925877134102249947176708719816474` |
| 3 | Staked GTC - Choice 3 | 🥩GTC-C3 | `52884023918372581696755029955867641465313182854755998268540055201622988098620` |
| 4 | Staked GTC - Choice 4 | 🥩GTC-C4 | `97940999879862486104046856375658994738036738590581900819813490438205806384215` |
| 5 | Staked GTC - Choice 5 | 🥩GTC-C5 | `35380129701972384510002605929200304946709073252919994962368378967284275041419` |
| 6 | Staked GTC - Choice 6 | 🥩GTC-C6 | `94250662400925372402988873403761622830124149153567946070200834062506463706964` |

Choice IDs are computed deterministically using `computeId(creator, salt)` where:
- Creator: `0x872D0Cf468Ee82cC7D6828f63DDceebb7F19eA19` (deployer/relayer)
- Salt: `bytes32(1)` through `bytes32(6)`

## Key Features Deployed

### StakeChoicesERC6909 System
- Multi-choice staking using ERC6909 multi-token standard
- Factory pattern for deploying new staking sessions
- Each choice is represented as a separate token ID with deterministic IDs
- Efficient staking and unstaking across multiple choices
- Metadata registration with name, symbol, and URI support
- Session-level `name()` function alongside per-choice `name(uint256 id)`

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
  stakeChoicesFactory: "0x17FC7698A7065B41007dC270Afa4aa85313E2717" as Address,
  stakeChoicesSession: "0x79ed6D4B6d582286944aD6cC18cB7A61Ca5c2199" as Address,
  stakerWallet: "0xaF0D544D654dFC34965D00177c47e7634641F2A7" as Address,
};

// Choice IDs for staking
const CHOICE_IDS = [
  35944569015047981758235818500518690797898803954137960285681681313226267984075n,
  50183950411008508464930554686549033253140240925877134102249947176708719816474n,
  52884023918372581696755029955867641465313182854755998268540055201622988098620n,
  97940999879862486104046856375658994738036738590581900819813490438205806384215n,
  35380129701972384510002605929200304946709073252919994962368378967284275041419n,
  94250662400925372402988873403761622830124149153567946070200834062506463706964n,
];
```

## Verification Status

✅ **All contracts successfully verified on Optimism Sepolia Etherscan!**

| Contract | Verification Status | Etherscan Link |
|----------|-------------------|----------------|
| TestERC20 | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756#code) |
| StakeChoicesFactory | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0x17FC7698A7065B41007dC270Afa4aa85313E2717#code) |
| StakeChoicesERC6909 Implementation | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0x3E89aba51ede4985cb3fBef33Bc5648e2BeF16B5#code) |
| Sample MultiToken | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0x79ed6D4B6d582286944aD6cC18cB7A61Ca5c2199#code) |
| StakerWallet | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0xaF0D544D654dFC34965D00177c47e7634641F2A7#code) |

**Compiler Settings Used:**
- Compiler: v0.8.30+commit.73712a01
- Optimization: Enabled with 200 runs
- EVM Version: Prague

## Contract Explorer Links

- [TestERC20](https://sepolia-optimism.etherscan.io/address/0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756)
- [StakeChoicesFactory](https://sepolia-optimism.etherscan.io/address/0x17FC7698A7065B41007dC270Afa4aa85313E2717)
- [StakeChoicesERC6909 Implementation](https://sepolia-optimism.etherscan.io/address/0x3E89aba51ede4985cb3fBef33Bc5648e2BeF16B5)
- [Sample MultiToken](https://sepolia-optimism.etherscan.io/address/0x79ed6D4B6d582286944aD6cC18cB7A61Ca5c2199)
- [StakerWallet](https://sepolia-optimism.etherscan.io/address/0xaF0D544D654dFC34965D00177c47e7634641F2A7)

# Deployed Contract Addresses - Optimism Sepolia

## Latest Deployment Date: October 14, 2025

### Network: Optimism Sepolia (Chain ID: 11155420)

| Contract | Address | Description |
|----------|---------|-------------|
| **TestERC20** | `0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756` | Test ERC20 token with public mint function |
| **StakeChoicesFactory** | `0x17FC7698A7065B41007dC270Afa4aa85313E2717` | Factory for deploying StakeChoicesERC6909 sessions |
| **StakeChoicesERC6909 Implementation** | `0x3E89aba51ede4985cb3fBef33Bc5648e2BeF16B5` | Implementation contract for ERC6909 multi-choice staking |
| **Sample StakeChoicesERC6909 MultiToken** | `0x79ed6D4B6d582286944aD6cC18cB7A61Ca5c2199` | Sample multi-token deployed via factory with 6 registered choices |
| **StakerWallet** | `0xeb5ed03c030448270d5671cd4ae79ad124765f26` | Gasless staking via EIP-7702 (relayer: 0x872D0Cf468Ee82cC7D6828f63DDceebb7F19eA19) |

## Registered Choices

The sample multi-token has 6 pre-registered choices:

| Choice | Name | Symbol | Choice ID |
|--------|------|--------|-----------|
| 1 | Staked GTC - Choice 1 | 🥩GTC-C1 | `99921030434853126453340568019546123113290951926625281747676119336391366179676` |
| 2 | Staked GTC - Choice 2 | 🥩GTC-C2 | `103467882007752256716465905423493267637639752828754828952501832282292424221652` |
| 3 | Staked GTC - Choice 3 | 🥩GTC-C3 | `37022085098767960322629082668856854414683424180269164484809959024879061362464` |
| 4 | Staked GTC - Choice 4 | 🥩GTC-C4 | `102590855234691522285546861392190170000582855349844279089213381909182907084793` |
| 5 | Staked GTC - Choice 5 | 🥩GTC-C5 | `113654052384035540339254108331114608443394203971279322386708763587320017623119` |
| 6 | Staked GTC - Choice 6 | 🥩GTC-C6 | `26590924299719391955823896655943307388838177793986195267126087681677919884365` |

Choice IDs are computed deterministically using `computeId(creator, salt)` where:
- Creator: `0x281A3b958d6068B41C1E0c9c5E0D17830fc78272` (choice metadata creator)
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
  stakerWallet: "0xeb5ed03c030448270d5671cd4ae79ad124765f26" as Address,
};

// Choice IDs for staking
const CHOICE_IDS = [
  99921030434853126453340568019546123113290951926625281747676119336391366179676n,
  103467882007752256716465905423493267637639752828754828952501832282292424221652n,
  37022085098767960322629082668856854414683424180269164484809959024879061362464n,
  102590855234691522285546861392190170000582855349844279089213381909182907084793n,
  113654052384035540339254108331114608443394203971279322386708763587320017623119n,
  26590924299719391955823896655943307388838177793986195267126087681677919884365n,
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
| StakerWallet | ✅ Pass - Verified | [View Code](https://sepolia-optimism.etherscan.io/address/0xeb5ed03c030448270d5671cd4ae79ad124765f26#code) |

**Compiler Settings Used:**
- Compiler: v0.8.30+commit.73712a01
- Optimization: Enabled with 200 runs
- EVM Version: Prague

## Contract Explorer Links

- [TestERC20](https://sepolia-optimism.etherscan.io/address/0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756)
- [StakeChoicesFactory](https://sepolia-optimism.etherscan.io/address/0x17FC7698A7065B41007dC270Afa4aa85313E2717)
- [StakeChoicesERC6909 Implementation](https://sepolia-optimism.etherscan.io/address/0x3E89aba51ede4985cb3fBef33Bc5648e2BeF16B5)
- [Sample MultiToken](https://sepolia-optimism.etherscan.io/address/0x79ed6D4B6d582286944aD6cC18cB7A61Ca5c2199)
- [StakerWallet](https://sepolia-optimism.etherscan.io/address/0xeb5ed03c030448270d5671cd4ae79ad124765f26)

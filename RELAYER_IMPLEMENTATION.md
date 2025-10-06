# EIP-7702 Relayer Implementation Guide

## Overview

This guide details the implementation of a gasless staking system using EIP-7702 delegation with a custom relayer. The system allows users to stake tokens without paying gas fees, while maintaining security through EOA ownership and signature verification.

## Architecture

### High-Level Flow
1. **User**: Signs EIP-7702 authorization to delegate their EOA to `StakerWallet` contract
2. **User**: Signs operation parameters (amount, nonce, deadline) with their private key
3. **Relayer**: Submits transaction with `authorizationList` and user's operation signature
4. **Contract**: Verifies signatures and executes approve + stake in single transaction
5. **Relayer**: Pays all gas costs

### Key Concepts
- **EIP-7702 Delegation**: EOA's code pointer is set to `StakerWallet` contract via `authorizationList`
- **Address Context**: The contract code executes AT the EOA's address, so `address(this)` is the EOA
- **Relayer Execution**: Relayer submits the tx and is `msg.sender`, but execution happens at EOA's address
- **Signature Verification**: Contract verifies operation was signed by the EOA owner (address(this))
- **Replay Protection**: Nonce mapping prevents signature reuse

---

## Part 1: Smart Contract Implementation

### Contract Architecture

You need to implement **two contracts**:

#### 1. `SelfBatchExecutor.sol`
Rename the existing `BatchExecutor.sol` to make the self-execution pattern explicit.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SelfBatchExecutor {
    // Existing implementation - just rename the contract
    // This is for user-signed transactions (no relayer)

    function executeBatch(Call[] calldata calls) external {
        require(msg.sender == address(this), "Must be delegated");
        // ... existing batch execution logic
    }
}
```

#### 2. `StakerWallet.sol` (NEW)

For better UX and security, use EIP-712 with namespaced storage (ERC-7201):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IStake {
    function stake(uint256 amount) external;
}

contract StakerWallet {
    using ECDSA for bytes32;

    // ERC-7201 namespaced storage to prevent collision on re-delegation
    struct StakerWalletStorage {
        mapping(address => uint256) nonces;
    }

    StakerWalletStorage private $ __at(erc7201("stakerwallet.main"));

    bytes32 private constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 private constant STAKE_AUTHORIZATION_TYPEHASH = keccak256(
        "StakeAuthorization(address account,uint256 nonce,uint256 amount,uint256 deadline)"
    );

    address public immutable SELF;
    address public immutable TOKEN_ADDRESS;
    address public immutable STAKE_CONTRACT;

    constructor(address token, address stakeContract) {
        SELF = address(this);  // Capture implementation address at deploy
        TOKEN_ADDRESS = token;
        STAKE_CONTRACT = stakeContract;
    }

    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes("StakerWallet")),
            keccak256(bytes("1")),
            block.chainid,
            SELF  // Use implementation address for better wallet UX
        ));
    }

    function stakeWithAuthorization(
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external {
        // msg.sender is the relayer, address(this) is the EOA in delegated context
        require(block.timestamp <= deadline, "Signature expired");

        uint256 currentNonce = $.nonces[address(this)];

        // Build EIP-712 hash
        bytes32 structHash = keccak256(abi.encode(
            STAKE_AUTHORIZATION_TYPEHASH,
            address(this),  // EOA account (this contract IS at EOA's address)
            currentNonce,   // nonce
            amount,         // amount
            deadline        // deadline
        ));

        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR(),
            structHash
        ));

        address signer = digest.recover(signature);
        require(signer == address(this), "Invalid signature");

        // Increment nonce before external calls (CEI pattern)
        $.nonces[address(this)]++;

        // Approve only the needed amount
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, amount);

        // Execute stake
        IStake(STAKE_CONTRACT).stake(amount);

        // Clear approval for extra safety
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, 0);
    }

    function nonces(address account) external view returns (uint256) {
        return $.nonces[account];
    }
}
```

### Deployment Script

Update your deployment script to deploy both contracts:

```solidity
// script/Deploy.s.sol
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SelfBatchExecutor.sol";
import "../src/StakerWallet.sol";
import "../src/TestERC20.sol";
import "../src/Stake.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy existing contracts
        SelfBatchExecutor batchExecutor = new SelfBatchExecutor();
        TestERC20 token = new TestERC20();
        Stake stake = new Stake(address(token));

        // Deploy new StakerWallet
        StakerWallet stakerWallet = new StakerWallet(
            address(token),
            address(stake)
        );

        console.log("SelfBatchExecutor:", address(batchExecutor));
        console.log("TestERC20:", address(token));
        console.log("Stake:", address(stake));
        console.log("StakerWallet:", address(stakerWallet));

        vm.stopBroadcast();
    }
}
```

### Testing

Create comprehensive tests for `StakerWallet`:

```solidity
// test/StakerWallet.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StakerWallet.sol";
import "../src/TestERC20.sol";
import "../src/Stake.sol";

contract StakerWalletTest is Test {
    StakerWallet public wallet;
    TestERC20 public token;
    Stake public stake;

    address user = address(0x1);
    uint256 userPrivateKey = 0x1;

    function setUp() public {
        token = new TestERC20();
        stake = new Stake(address(token));
        wallet = new StakerWallet(address(token), address(stake));

        // Mint tokens to user
        token.mint(user, 1000e18);
    }

    function testStakeWithAuthorization() public {
        // This test CANNOT fully verify EIP-7702 behavior
        // because we can't simulate delegation in Foundry
        // It can only test signature verification logic

        uint256 amount = 100e18;
        uint256 deadline = block.timestamp + 1 hours;
        uint256 nonce = wallet.getNonce(user);

        // Build message hash (same as contract)
        // BUt actually replace this with eip712 version
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(
                user,
                nonce,
                amount,
                deadline,
                block.chainid
            ))
        ));

        // Sign with user's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // NOTE: This test can verify signature logic but cannot test
        // the full EIP-7702 delegation behavior in Foundry
        // Real testing requires on-chain deployment with EIP-7702

        // In Foundry, we can test by deploying the wallet at a specific address
        // and having that address call itself, but it won't truly simulate
        // the EIP-7702 delegation semantics
    }
}
```

**IMPORTANT**: Full testing requires deployment to a network with EIP-7702 support (Optimism Sepolia) because Foundry cannot simulate the EIP-7702 delegation behavior where the contract code executes at the EOA's address.

### Security Considerations

1. **Signature Verification**: Always verify `signer == address(this)` to ensure EOA owner authorized
2. **Replay Protection**: ERC-7201 namespaced nonces prevent replay attacks and storage collisions
3. **Storage Safety**: Using `erc7201("stakerwallet.main")` ensures virtually zero collision risk on re-delegation
4. **Deadline Validation**: Check signature hasn't expired
5. **Chain ID**: Included in DOMAIN_SEPARATOR to prevent cross-chain replay
6. **Reentrancy**: CEI pattern with nonce increment before external calls
7. **Approval Hygiene**: Approve exact amount and clear to zero after execution
8. **Domain Separator**: Uses implementation address (SELF) for proper wallet UX and phishing protection
9. **Relayer Trust**: Relayer can censor but cannot forge signatures or steal funds

---

## Part 2: Information for Frontend Team

Once contracts are deployed, provide the frontend team with:

### Deployment Addresses
```json
{
  "chainId": 11155420,
  "network": "optimism-sepolia",
  "contracts": {
    "stakerWallet": "0x...",
    "token": "0x...",
    "stake": "0x...",
    "selfBatchExecutor": "0x..."
  }
}
```

### Contract ABIs
Export the following ABIs:
- `StakerWallet.json` (especially `stakeWithAuthorization`, `getNonce`)
- `TestERC20.json` (for `mint`, `balanceOf`)
- `Stake.json` (for reading stake balances)

### Signature Format

**If using EIP-712 (RECOMMENDED):**
```typescript
const domain = {
  name: 'StakerWallet',
  version: '1',
  chainId: 11155420,
  verifyingContract: stakerWalletAddress
};

const types = {
  StakeAuthorization: [
    { name: 'account', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};
```

**If using personal_sign:**
**But we're not, so tell them about eip712 method**
```typescript
const message = ethers.utils.solidityKeccak256(
  ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
  [account, nonce, amount, deadline, chainId]
);
// Then wrap with Ethereum prefix
```

### API Endpoints

The relayer should expose:

**POST /api/stake**
```json
{
  "authorization": {
    "chainId": "0x...",
    "address": "0x...",
    "nonce": "0x...",
    "v": 27,
    "r": "0x...",
    "s": "0x..."
  },
  "operation": {
    "amount": "100000000000000000000",
    "deadline": 1735689600,
    "signature": "0x..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "status": "pending"
}
```

### Testing Instructions for Frontend

1. **Get test tokens**: Call `token.mint(userAddress, amount)`
2. **Check nonce**: Call `stakerWallet.getNonce(userAddress)`
3. **Sign authorization**: User signs EIP-7702 authorization for `stakerWallet`
4. **Sign operation**: User signs stake operation with nonce
5. **Submit to relayer**: POST both signatures to relayer API
6. **Wait for confirmation**: Poll for transaction receipt
7. **Verify stake**: Check balance in `stake` contract

### Gas Estimation

Provide estimates for the relayer's cost per transaction:
- EIP-7702 with approve + stake: ~150k-200k gas
- At 0.1 gwei: ~$0.02 per transaction (on Optimism)

### Error Codes

Document common errors:
- `"Invalid signature"`: Operation signature doesn't match EOA owner
- `"Signature expired"`: Deadline passed
- Authorization errors: EIP-7702 authorization not included or invalid in transaction
- Nonce mismatch: User used wrong nonce (frontend should refresh)

---

## Deployment Checklist

- [ ] Deploy `SelfBatchExecutor` (renamed from `BatchExecutor`)
- [ ] Deploy `TestERC20` token
- [ ] Deploy `Stake` contract
- [ ] Deploy `StakerWallet` with correct token and stake addresses
- [ ] Verify all contracts on block explorer
- [ ] Test with manual transactions on testnet
- [ ] Document all addresses and ABIs
- [ ] Provide deployment info to frontend team
- [ ] Test full flow with relayer integration

---

## Next Steps After Contract Deployment

**For Frontend Team:**
The frontend implementation guide will detail:
1. NFC integration with EIP-7702 authorization signing
2. Operation signature creation (EIP-712 or personal_sign)
3. Relayer API integration
4. Transaction status monitoring
5. Error handling and retry logic
6. User flow and UX considerations

**For Relayer Team:**
The relayer implementation guide will detail:
1. Cloudflare Worker setup
2. Signature validation
3. Transaction submission with `authorizationList`
4. Gas management and rate limiting
5. Error handling and logging
6. Monitoring and alerting

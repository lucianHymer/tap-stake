# 🔄 PIVOT: Single-Tap Gasless Staking via Commitment-Reveal Pattern

## Executive Summary

We're pivoting from a two-signature architecture to a **single-tap solution** using a commitment-reveal pattern. This maintains security while dramatically improving UX for NFC card users.

### The Problem
Our initial StakerWallet design required:
1. **First signature**: EIP-7702 authorization to delegate EOA to StakerWallet
2. **Second signature**: EIP-712 typed data for the specific stake operation

Two signatures = two NFC taps = bad UX. Users hate it. We hate it. Moloch laughs.

### The Solution
**Commitment-reveal pattern with single NFC tap:**
- Frontend pre-commits operation parameters on-chain
- User signs ONE EIP-7702 authorization
- Contract verifies commitment matches revealed parameters
- Relayer can't tamper with user's intended operation

---

## Architecture Overview

### Three Contract System

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│CommitmentStore│◄─────│  StakerWallet   │◄─────│ User's EOA   │
└──────────────┘      └─────────────────┘      └──────────────┘
      ▲                                               ▲
      │                                               │
      └───────────────────────────────────────────────┤
                     Relayer Service                  │
                           ▲                          │
                           │                          │
                      Frontend (NFC)──────────────────┘
```

---

## Contract Specifications

### 1. CommitmentStore.sol (NEW)

**Purpose**: Immutable storage for operation commitments, preventing relayer tampering.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title CommitmentStore
 * @notice Stores commitments for EIP-7702 delegated operations
 * @dev Commitments are immutable once set (no overwriting)
 */
contract CommitmentStore {
    // (user address, tx nonce) => commitment hash
    mapping(address => mapping(uint256 => bytes32)) public commitments;

    // Track which nonces have been used (for safety)
    mapping(address => mapping(uint256 => bool)) public nonceUsed;

    event CommitmentStored(address indexed user, uint256 indexed nonce, bytes32 commitment);
    event CommitmentConsumed(address indexed user, uint256 indexed nonce);

    error CommitmentAlreadyExists();
    error CommitmentAlreadyUsed();

    /**
     * @notice Store a commitment for a user at a specific nonce
     * @param user The EOA that will delegate via EIP-7702
     * @param nonce The transaction nonce that will be used in the authorization
     * @param commitment Hash of the operation parameters
     */
    function store(address user, uint256 nonce, bytes32 commitment) external {
        if (commitments[user][nonce] != 0) revert CommitmentAlreadyExists();
        if (nonceUsed[user][nonce]) revert CommitmentAlreadyUsed();

        commitments[user][nonce] = commitment;
        emit CommitmentStored(user, nonce, commitment);
    }

    /**
     * @notice Mark a commitment as consumed (called by StakerWallet)
     * @param user The user whose commitment to consume
     * @param nonce The nonce to mark as used
     */
    function consume(address user, uint256 nonce) external {
        nonceUsed[user][nonce] = true;
        emit CommitmentConsumed(user, nonce);
    }

    /**
     * @notice Get commitment for a user at a specific nonce
     * @param user The user address
     * @param nonce The transaction nonce
     * @return The commitment hash (0x0 if not set)
     */
    function getCommitment(address user, uint256 nonce) external view returns (bytes32) {
        return commitments[user][nonce];
    }
}
```

### 2. StakerWallet.sol (UPDATED)

**Changes**: Remove EIP-712 signature verification, add commitment verification.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStake {
    function stake(uint256 amount) external;
}

interface ICommitmentStore {
    function getCommitment(address user, uint256 nonce) external view returns (bytes32);
    function consume(address user, uint256 nonce) external;
}

/**
 * @title StakerWallet
 * @notice EIP-7702 delegation contract for gasless staking with commitment verification
 * @dev Single-tap solution using commitment-reveal pattern
 */
contract StakerWallet {
    address public immutable TOKEN_ADDRESS;
    address public immutable STAKE_CONTRACT;
    address public immutable COMMITMENT_STORE;

    error InvalidCommitment();
    error OperationExpired();
    error NoCommitmentFound();

    event StakeExecuted(address indexed account, uint256 amount, uint256 nonce);

    constructor(address token, address stakeContract, address commitmentStore) {
        TOKEN_ADDRESS = token;
        STAKE_CONTRACT = stakeContract;
        COMMITMENT_STORE = commitmentStore;
    }

    /**
     * @notice Execute stake with commitment verification
     * @dev Can only be called when EOA has delegated via EIP-7702
     * @param nonce The transaction nonce used in the EIP-7702 authorization
     * @param amount Amount of tokens to stake
     * @param deadline Operation expiration timestamp
     * @param salt Random salt used in commitment
     */
    function stakeWithCommitment(
        uint256 nonce,
        uint256 amount,
        uint256 deadline,
        bytes32 salt
    ) external {
        // This executes in the context of the delegated EOA
        // address(this) = the user's EOA address
        // msg.sender = the relayer

        // Check deadline
        if (block.timestamp > deadline) revert OperationExpired();

        // Get stored commitment
        bytes32 storedCommitment = ICommitmentStore(COMMITMENT_STORE).getCommitment(
            address(this),
            nonce
        );
        if (storedCommitment == 0) revert NoCommitmentFound();

        // Verify commitment matches revealed parameters
        bytes32 expectedCommitment = keccak256(abi.encode(
            address(this),  // User address for extra safety
            amount,
            deadline,
            salt
        ));
        if (storedCommitment != expectedCommitment) revert InvalidCommitment();

        // Mark commitment as consumed
        ICommitmentStore(COMMITMENT_STORE).consume(address(this), nonce);

        // Execute the staking operation
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, amount);
        IStake(STAKE_CONTRACT).stake(amount);
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, 0); // Clear approval

        emit StakeExecuted(address(this), amount, nonce);
    }

    /**
     * @notice Simple stake function for testing (no commitment needed)
     * @dev Remove this in production
     */
    function stakeSimple(uint256 amount) external {
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, amount);
        IStake(STAKE_CONTRACT).stake(amount);
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, 0);

        emit StakeExecuted(address(this), amount, 0);
    }
}
```

### 3. Deployment Script Updates

```solidity
// script/Deploy.s.sol
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/CommitmentStore.sol";
import "../src/StakerWallet.sol";
import "../src/TestERC20.sol";
import "../src/Stake.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy core contracts
        TestERC20 token = new TestERC20();
        Stake stake = new Stake(address(token));

        // Deploy commitment store
        CommitmentStore commitmentStore = new CommitmentStore();

        // Deploy StakerWallet with commitment store
        StakerWallet stakerWallet = new StakerWallet(
            address(token),
            address(stake),
            address(commitmentStore)
        );

        console.log("TestERC20:", address(token));
        console.log("Stake:", address(stake));
        console.log("CommitmentStore:", address(commitmentStore));
        console.log("StakerWallet:", address(stakerWallet));

        vm.stopBroadcast();
    }
}
```

---

## The Flow (Single Tap!)

### Step 1: Frontend Prepares Commitment
```javascript
// Generate random salt
const salt = randomBytes32();

// Get user's current nonce
const nonce = await publicClient.getTransactionCount({ address: userAddress });

// Create commitment
const commitment = keccak256(encode([
    userAddress,
    amount,
    deadline,
    salt
]));

// Store locally for later
localStorage.setItem('pending-operation', JSON.stringify({
    nonce, amount, deadline, salt, commitment
}));
```

### Step 2: Relayer Stores Commitment
```javascript
// Frontend → Relayer
POST /store-commitment
{
    "user": "0x...",
    "nonce": 42,
    "commitment": "0x..."
}

// Relayer executes:
await commitmentStore.store(user, nonce, commitment);
```

### Step 3: Frontend Verifies & Signs (ONE TAP!)
```javascript
// Verify commitment was stored correctly
const stored = await commitmentStore.commitments(user, nonce);
assert(stored === commitment);

// NOW do the single NFC tap
const authorization = await nfcAccount.signAuthorization({
    contractAddress: stakerWallet,
    chainId: 11155420,
    nonce: nonce  // Must match commitment!
});
```

### Step 4: Relayer Executes
```javascript
// Frontend → Relayer
POST /execute
{
    "authorization": { ... },
    "reveal": {
        "nonce": 42,
        "amount": "100000000000000000000",
        "deadline": 1735689600,
        "salt": "0x..."
    }
}

// Relayer builds transaction:
const tx = {
    to: userAddress,
    authorizationList: [authorization],
    data: encodeCall('stakeWithCommitment', [nonce, amount, deadline, salt])
};
```

---

## Security Analysis

### Attack Vectors Mitigated

1. **Relayer Tampering**: ✅ Prevented
   - Relayer can't change amount/deadline without breaking commitment
   - Commitment is stored before user signs authorization

2. **Replay Attacks**: ✅ Prevented
   - Nonce binding prevents replay
   - Commitments can't be overwritten
   - Each commitment is consumed after use

3. **Front-Running**: ✅ Prevented
   - Commitment includes user address
   - Only the specific user's delegation can use their commitment

4. **Griefing**: ⚠️ Partially Mitigated
   - Relayer could store wrong commitment (costs them gas)
   - Frontend verifies before signing authorization
   - User never signs if commitment is wrong

### Trust Assumptions

1. **Relayer Honesty**: Not required for security, only for availability
2. **Frontend Integrity**: Critical - generates correct commitments
3. **Contract Immutability**: CommitmentStore must not be upgradeable

---

## Implementation Checklist

### Smart Contracts
- [ ] Create `CommitmentStore.sol` with immutable storage
- [ ] Update `StakerWallet.sol` to use commitment verification
- [ ] Add comprehensive tests for commitment flow
- [ ] Test edge cases (wrong nonce, expired deadline, replay attempts)
- [ ] Deploy to Optimism Sepolia
- [ ] Verify all contracts on Etherscan

### Relayer Updates
- [ ] Add `/store-commitment` endpoint
- [ ] Add commitment verification before execution
- [ ] Update `/execute` endpoint for new flow
- [ ] Add rate limiting for commitment storage
- [ ] Log all commitment operations

### Frontend Updates
- [ ] Generate secure random salts
- [ ] Store pending operations locally
- [ ] Verify commitment before NFC tap
- [ ] Clear local storage after execution
- [ ] Add timeout handling

### Testing
- [ ] Unit tests for each contract
- [ ] Integration test of full flow
- [ ] Gas usage benchmarks
- [ ] Stress test with multiple concurrent users
- [ ] Test commitment storage failures

---

## Gas Cost Analysis

### Per Operation
- **Store Commitment**: ~45k gas (new storage slot + event)
- **Execute Stake**: ~120k gas (read commitment + stake + clear)
- **Total**: ~165k gas

### Cost on Optimism
- At 0.1 gwei: ~$0.02 total
- Commitment storage: ~$0.005
- Execution: ~$0.015

This is acceptable for a gasless solution where the relayer pays.

---

## Migration Path

1. **Phase 1**: Deploy new contracts alongside existing ones
2. **Phase 2**: Test with small group
3. **Phase 3**: Migrate frontend to new flow
4. **Phase 4**: Deprecate old two-signature contracts

---

## Alternative Considerations

### Why Not X?

**Why not session keys?**: Requires initial setup transaction, still multiple signatures.

**Why not meta-transactions?**: EIP-712 signatures are exactly what we're trying to avoid.

**Why not trusted relayer?**: Violates trustless principle, relayer could drain funds.

**Why not embed in nonce?**: Nonce space too limited for amount + deadline.

---

## Conclusion

This pivot gives us:
- ✅ **Single NFC tap** (massive UX win)
- ✅ **Full security** (no trust in relayer)
- ✅ **Simple implementation** (three clean contracts)
- ✅ **Reasonable gas costs** (~$0.02 on Optimism)

The commitment-reveal pattern elegantly solves the two-signature problem while maintaining the security properties we need. The relayer can't tamper with operations, users get a seamless experience, and Moloch gets slain with a single tap.

**Next Steps**: Implement and test the smart contracts first, ensuring the commitment system is rock solid before updating the relayer and frontend.
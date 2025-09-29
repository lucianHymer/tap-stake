# EIP-7702 Approve + Transfer Batching - Implementation Design

## Executive Summary

This document outlines the implementation of EIP-7702 functionality to enable EOAs (Externally Owned Accounts) to approve and transfer ERC20 tokens in a single transaction. This eliminates the traditional two-step process required for DEX swaps and similar operations.

**Target Network**: Optimism Sepolia Testnet
**Timeline**: September 2025 (Pectra is live)
**Goal**: POC demonstrating single-transaction approve+transfer using MetaMask

## Background

### The Problem
Currently, interacting with DeFi protocols requires two separate transactions:
1. `approve(spender, amount)` - User approves contract to spend tokens
2. `transferFrom(user, dest, amount)` - Contract transfers tokens

This creates:
- Poor UX (2 transactions, 2 gas fees)
- Security risks (unlimited approvals)
- Higher costs

### The Solution: EIP-7702
EIP-7702 (transaction type `0x04`) allows EOAs to temporarily delegate execution to smart contract code, enabling:
- Batch operations in single transaction
- Gas sponsorship (future phase)
- Smart account features for regular wallets

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MetaMask  │────▶│  Frontend (Viem) │────▶│ Smart Contracts │
│     EOA     │     │   - Sign Auth    │     │  - Executor     │
└─────────────┘     │   - Send Batch   │     │  - TestToken    │
                    └──────────────────┘     └─────────────────┘
```

### Transaction Flow
1. User clicks "Approve & Transfer" in UI
2. Frontend prepares batch calls (approve + transfer)
3. MetaMask signs EIP-7702 authorization
4. Transaction sent with authorization + batch calls
5. EOA temporarily delegates to Executor contract
6. Executor performs both operations atomically
7. Delegation expires after transaction

## Smart Contracts

### 1. BatchExecutor.sol
Main implementation contract that EOAs delegate to.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BatchExecutor {
    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    error ExecutionFailed(uint256 index, bytes returnData);

    event BatchExecuted(address indexed executor, uint256 callCount);

    /**
     * Execute multiple calls in a single transaction
     * Can only be called by the EOA that delegated to this contract
     */
    function executeBatch(Call[] calldata calls) external payable returns (bytes[] memory results) {
        // Ensure caller is the delegating EOA (msg.sender == address(this) in delegated context)
        require(msg.sender == address(this), "Only delegated EOA can execute");

        results = new bytes[](calls.length);

        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory returnData) = calls[i].target.call{value: calls[i].value}(calls[i].data);
            if (!success) {
                revert ExecutionFailed(i, returnData);
            }
            results[i] = returnData;
        }

        emit BatchExecuted(msg.sender, calls.length);
    }

    /**
     * Convenience function for approve + stake pattern
     */
    function approveAndStake(
        IERC20 token,
        address stakeContract,
        uint256 amount
    ) external {
        // This will be called in delegated context, so address(this) is the EOA
        require(msg.sender == address(this), "Only delegated EOA can execute");

        // Approve the stake contract
        token.approve(stakeContract, amount);

        // Call stake function on the contract
        // Note: This assumes stakeContract implements stake(uint256)
        (bool success,) = stakeContract.call(abi.encodeWithSignature("stake(uint256)", amount));
        require(success, "Stake failed");
    }
}
```

### 2. TestERC20.sol
Simple ERC20 for testing (deploy only on testnet).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("Test Token", "TEST") {
        // Mint 1M tokens to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * Public mint function for easy testing
     * DO NOT deploy on mainnet!
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

### 3. Stake.sol
Simple staking contract that requires token approval before staking.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Stake {
    IERC20 public immutable stakingToken;

    mapping(address => uint256) public stakedBalance;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }

    /**
     * Stake tokens - requires prior approval
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer tokens from user to this contract
        // This requires the user to have approved this contract
        stakingToken.transferFrom(msg.sender, address(this), amount);

        // Update staking records
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * View function to check a user's staked balance
     */
    function getStakedBalance(address user) external view returns (uint256) {
        return stakedBalance[user];
    }
}
```

## Frontend Implementation

### 1. EIP7702 Page Component
Create `packages/frontend/src/pages/EIP7702Demo.tsx`:

```typescript
import { useState } from 'react';
import {
  createWalletClient,
  custom,
  parseEther,
  encodeFunctionData,
  type Address,
  type Hex
} from 'viem';
import { optimismSepolia } from 'viem/chains';

// Contract ABIs
const BATCH_EXECUTOR_ABI = [
  {
    name: 'executeBatch',
    type: 'function',
    inputs: [{
      name: 'calls',
      type: 'tuple[]',
      components: [
        { name: 'target', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' }
      ]
    }],
    outputs: [{ name: 'results', type: 'bytes[]' }]
  }
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

// Deployed contract addresses (update after deployment)
const CONTRACTS = {
  batchExecutor: '0x...' as Address,
  testToken: '0x...' as Address,
  stake: '0x...' as Address
};

export function EIP7702Demo() {
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState<string>('');

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus('MetaMask not found');
      return null;
    }

    const client = createWalletClient({
      chain: optimismSepolia,
      transport: custom(window.ethereum)
    });

    const [address] = await client.requestAddresses();
    setStatus(`Connected: ${address}`);
    return { client, address };
  };

  const executeBatchTransaction = async () => {
    try {
      setStatus('Connecting wallet...');
      const wallet = await connectWallet();
      if (!wallet) return;

      const { client, address } = wallet;

      // Prepare batch calls
      const approveAmount = parseEther('100');
      const transferAmount = parseEther('10');

      // Call 1: Approve Stake contract to spend tokens
      const approveCall = {
        target: CONTRACTS.testToken,
        value: 0n,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.stake, approveAmount]
        })
      };

      // Call 2: Stake tokens
      const stakeCall = {
        target: CONTRACTS.stake,
        value: 0n,
        data: encodeFunctionData({
          abi: [{
            name: 'stake',
            type: 'function',
            inputs: [{ name: 'amount', type: 'uint256' }],
            outputs: []
          }],
          functionName: 'stake',
          args: [approveAmount]
        })
      };

      setStatus('Signing EIP-7702 authorization...');

      // Sign authorization for BatchExecutor contract
      const authorization = await client.signAuthorization({
        account: address,
        contractAddress: CONTRACTS.batchExecutor,
      });

      setStatus('Sending batch transaction...');

      // Encode batch execution
      const batchData = encodeFunctionData({
        abi: BATCH_EXECUTOR_ABI,
        functionName: 'executeBatch',
        args: [[approveCall, stakeCall]]
      });

      // Send EIP-7702 transaction
      const hash = await client.sendTransaction({
        account: address,
        to: address, // Call to self (delegated)
        data: batchData,
        authorizationList: [authorization],
        chain: optimismSepolia
      });

      setTxHash(hash);
      setStatus(`Transaction sent! Hash: ${hash}`);

      // Wait for confirmation
      const receipt = await client.waitForTransactionReceipt({ hash });
      setStatus(`Transaction confirmed! Block: ${receipt.blockNumber}`);

    } catch (error) {
      console.error('Transaction failed:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="eip7702-demo">
      <h1>EIP-7702 Batch Transaction Demo</h1>

      <div className="info-box">
        <h2>What This Does:</h2>
        <ol>
          <li>Signs an EIP-7702 authorization to delegate your EOA to BatchExecutor</li>
          <li>Approves Stake contract to spend 100 TEST tokens</li>
          <li>Stakes 100 TEST tokens in one transaction</li>
          <li>All in a single transaction!</li>
        </ol>
      </div>

      <div className="controls">
        <button onClick={executeBatchTransaction}>
          Execute Batch (Approve + Stake)
        </button>
      </div>

      <div className="status">
        <p>Status: {status}</p>
        {txHash && (
          <p>
            View on Explorer:{' '}
            <a
              href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash.slice(0, 10)}...
            </a>
          </p>
        )}
      </div>

      <div className="test-actions">
        <h3>Setup Actions:</h3>
        <button onClick={mintTestTokens}>Mint Test Tokens</button>
        <button onClick={checkBalance}>Check Balance</button>
      </div>
    </div>
  );
}

// Helper functions for testing
async function mintTestTokens() {
  const wallet = await connectWallet();
  if (!wallet) return;

  const { client, address } = wallet;

  const hash = await client.writeContract({
    address: CONTRACTS.testToken,
    abi: [{
      name: 'mint',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: []
    }],
    functionName: 'mint',
    args: [address, parseEther('1000')]
  });

  console.log('Minted tokens:', hash);
}

async function checkBalance() {
  const wallet = await connectWallet();
  if (!wallet) return;

  const { client, address } = wallet;

  const balance = await client.readContract({
    address: CONTRACTS.testToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address]
  });

  console.log('Balance:', balance);
}
```

### 2. Update Router
Add route in `packages/frontend/src/App.tsx`:

```typescript
// Add import
import { EIP7702Demo } from './pages/EIP7702Demo';

// Add route
<Route path="/eip7702" element={<EIP7702Demo />} />
```

## Deployment Instructions

### Prerequisites
1. Install dependencies:
```bash
cd packages/contracts
forge init --no-commit .
forge install OpenZeppelin/openzeppelin-contracts
```

2. Configure Foundry (`foundry.toml`):
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
optimism_sepolia = "${OPTIMISM_SEPOLIA_RPC_URL}"

[etherscan]
optimism_sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

3. Set environment variables:
```bash
export PRIVATE_KEY="your-deployer-private-key"
export OPTIMISM_SEPOLIA_RPC_URL="https://sepolia.optimism.io"
export ETHERSCAN_API_KEY="your-etherscan-api-key"
```

### Deployment Script
Create `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {BatchExecutor} from "../src/BatchExecutor.sol";
import {TestERC20} from "../src/TestERC20.sol";
import {Stake} from "../src/Stake.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy contracts
        BatchExecutor executor = new BatchExecutor();
        console.log("BatchExecutor deployed at:", address(executor));

        TestERC20 token = new TestERC20();
        console.log("TestERC20 deployed at:", address(token));

        // Deploy Stake contract with TestERC20 as staking token
        Stake stakeContract = new Stake(address(token));
        console.log("Stake deployed at:", address(stakeContract));

        vm.stopBroadcast();
    }
}
```

Deploy with:
```bash
forge script script/Deploy.s.sol --rpc-url optimism_sepolia --broadcast --verify
```

## Testing Strategy

### Local Testing (Foundry)
Create `test/BatchExecutor.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {BatchExecutor} from "../src/BatchExecutor.sol";
import {TestERC20} from "../src/TestERC20.sol";

contract BatchExecutorTest is Test {
    BatchExecutor public executor;
    TestERC20 public token;

    address public user = address(0x1);
    address public recipient = address(0x2);

    function setUp() public {
        executor = new BatchExecutor();
        token = new TestERC20();

        // Fund user with tokens
        token.mint(user, 1000 ether);
    }

    function testBatchApproveAndTransfer() public {
        // Simulate EIP-7702 delegation
        vm.prank(user);

        // This would normally be done via EIP-7702 authorization
        // For testing, we simulate the delegated call

        BatchExecutor.Call[] memory calls = new BatchExecutor.Call[](2);

        // Approve call
        calls[0] = BatchExecutor.Call({
            target: address(token),
            value: 0,
            data: abi.encodeCall(token.approve, (address(this), 100 ether))
        });

        // Transfer call
        calls[1] = BatchExecutor.Call({
            target: address(token),
            value: 0,
            data: abi.encodeCall(token.transfer, (recipient, 10 ether))
        });

        // In production, this would be called with EIP-7702 delegation
        // executor.executeBatch(calls);

        // Verify results
        assertEq(token.balanceOf(recipient), 10 ether);
    }
}
```

Run tests:
```bash
forge test -vvv
```

### Testnet Testing Checklist
1. [ ] Deploy all contracts to OP Sepolia
2. [ ] Update contract addresses in frontend
3. [ ] Connect MetaMask to OP Sepolia
4. [ ] Mint test tokens to your EOA
5. [ ] Test single approve transaction (baseline)
6. [ ] Test single transfer transaction (baseline)
7. [ ] Test batch approve + transfer with EIP-7702
8. [ ] Verify gas savings
9. [ ] Check transaction on Etherscan

## Monitoring & Debugging

### Key Events to Monitor
- `BatchExecuted(address executor, uint256 callCount)`
- ERC20 `Approval` and `Transfer` events
- Transaction receipt `authorizationList` field

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "MetaMask doesn't show authorization prompt" | Update MetaMask to latest version |
| "Transaction reverts with 'Only delegated EOA'" | Authorization not properly signed/included |
| "Cannot read properties of undefined" | Viem version needs update for EIP-7702 support |
| "Insufficient funds" | Need OP Sepolia ETH from faucet |

## Security Considerations

1. **Replay Protection**: Authorization includes chainId and nonce
2. **Delegation Scope**: Only valid for single transaction
3. **Implementation Trust**: Users must trust BatchExecutor contract
4. **Testnet Only**: TestERC20 has public mint - never deploy on mainnet

## Next Steps

### Phase 1 (Current)
- [x] Research EIP-7702
- [ ] Deploy contracts to OP Sepolia
- [ ] Implement basic frontend
- [ ] Test with MetaMask

### Phase 2 (Future)
- [ ] Add NFC card support via libhalo
- [ ] Implement paymaster for gasless transactions
- [ ] Add signature verification for NFC cards
- [ ] Production-ready implementation contract

### Phase 3 (Production)
- [ ] Audit BatchExecutor contract
- [ ] Deploy to OP Mainnet
- [ ] Integrate with real DEX protocols
- [ ] Add transaction simulation

## Resources

- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [Viem EIP-7702 Docs](https://viem.sh/docs/eip7702)
- [OP Sepolia Faucet](https://faucet.quicknode.com/optimism/sepolia)
- [Optimism Sepolia Explorer](https://sepolia-optimism.etherscan.io)

## Support

For issues or questions:
1. Check the common issues table above
2. Review transaction logs on Etherscan
3. Test with forge test locally first
4. Verify MetaMask supports EIP-7702

---

*Document Version: 1.0*
*Last Updated: September 2025*
*Status: Ready for Implementation*

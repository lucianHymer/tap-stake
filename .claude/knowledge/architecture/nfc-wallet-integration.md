# NFC Wallet Integration Architecture

## LibHalo NFC Wallet Pattern
LibHalo enables NFC card wallets through a callback-based architecture:
1. **Multi-platform support**: execHaloCmdWeb/RN/PCSC APIs for web/mobile/desktop
2. **Signing flow**: NFC card holds ECDSA private key, signs digests via 'sign' command
3. **Viem integration**: createViemHaloAccount wraps NFC signing in standard Viem account interface
4. **Wallet creation**: getData() retrieves EOA address from card, signDigestCallback delegates signing to NFC
5. **Transaction flow**: serialize tx → generate digest → NFC sign → verify signer matches EOA
6. **Paymaster support**: Supports both direct transactions and relayPermitAndTransfer for sponsored txs

**Related files**: viem_account.ts, index.ts, Burner.tsx

## EOA Paymaster Support on Optimism (2024-2025)
Multiple approaches for EOA gas sponsorship without smart wallets:
1. **Circle Paymaster**: Now supports EOAs directly on 7 chains including Optimism, using USDC for gas
2. **EIP-7702 (2025)**: Allows EOAs to temporarily act as smart accounts for sponsored transactions
3. **Alchemy Paymaster**: Available on Optimism (0x4Fd9098af9ddcB41DA48A1d78F91F1398965addc) but traditionally for smart wallets
4. **BEP-414 standard**: EOA-specific paymaster APIs (BSC-focused but shows the pattern)

Key insight: EOA paymaster support is emerging but fragmented - Circle's solution and EIP-7702 are the main paths forward.

## EIP-7702 Deployment Status
EIP-7702 is NOT yet live on Ethereum mainnet (scheduled for May 7, 2025 with Pectra upgrade), but IS live on:
- BSC Mainnet
- Odyssey Testnet  
- Some OP-Stack chains (Base, Optimism, Zora)
- Ethereum testnets (Sepolia, Holesky)

This enables EIP-7702 for EOA gas sponsorship on Optimism NOW, not waiting for Ethereum mainnet.

## EIP-7702 NFC Integration Requirements
To use EIP-7702 with NFC cards via libhalo:
1. Current libburner viem_account only has signMessage/signTransaction/signTypedData
2. Need to add signAuthorization method that:
   - Encodes authorization message (chainId, nonce, contractAddress)
   - Hashes with keccak256
   - Signs digest via NFC signDigestCallback
   - Returns authorization with signature parts (y_parity, r, s)
3. Two-signature flow: First sign authorization, then sign transaction with authorizationList
4. This enables EOA to temporarily delegate to smart account for paymaster sponsorship

**Related files**: viem_account.ts

## Tap-Stake NFC Wallet Implementation
Minimal NFC wallet app using libhalo for card interaction and viem for Ethereum operations:
- Monorepo structure with frontend package built with Vite + React + TypeScript
- nfc.ts module handles NFC card communication using libhalo's execHaloCmdWeb API
- Creates viem-compatible accounts that delegate signing to NFC cards  
- Two-step flow: first read card address, then sign messages
- Signature verification by recovering address from signature
- Phase 2 will add EIP-7702 support for gasless transactions via paymaster

**Related files**: tap-stake/packages/frontend/src/lib/nfc.ts, tap-stake/packages/frontend/src/App.tsx

## EIP-7702 Approve and Transfer Batching Pattern
EIP-7702 enables EOAs to execute smart contract logic by temporarily delegating to a contract implementation. Key pattern for approve+transfer in single transaction:

1. EOA signs an authorization to delegate to implementation contract
2. Implementation contract has executeBatch() function that accepts array of calls
3. Within single tx, EOA can:
   - Call ERC20.approve(spender, amount)
   - Call contract.transferFrom(EOA, dest, amount)

This solves the two-transaction problem for DEX swaps and similar operations. The authorization includes chainId, nonce, contractAddress for replay protection.

Viem provides helpers: signAuthorization(), writeContract() with authorizationList parameter.

Status: EIP-7702 scheduled for Ethereum mainnet May 7, 2025 but already live on some OP-Stack chains (Base, Optimism, Zora) and BSC mainnet. Testing can be done on Sepolia testnet or local Foundry with Prague hardfork.

**Related files**: packages/contracts/

## EIP-7702 Frontend Integration Strategy
The EIP-7702 demo will be integrated into the existing frontend framework at packages/frontend/ which already has:
- Vite + React + TypeScript setup
- Demon-slayer themed UI
- NFC integration via libhalo

For the POC, we'll add a new page/route for EIP-7702 testing that can be accessed separately from the main NFC flow. This allows testing with MetaMask while keeping the existing NFC functionality intact.

The design document (EIP7702_DESIGN.md) provides complete implementation details including:
- BatchExecutor contract for delegated execution
- TestERC20 for easy testing on OP Sepolia
- MockDEX to simulate approve+swap patterns
- Frontend component with Viem integration
- Full deployment and testing instructions

**Related files**: packages/contracts/EIP7702_DESIGN.md, packages/frontend/

## EIP-7702 BatchExecutor Implementation Pattern
The BatchExecutor contract uses a self-referential security check (msg.sender == address(this)) to ensure it only executes when an EOA delegates to it via EIP-7702. This is the core pattern for delegation contracts. The contract provides:
- **executeBatch()**: For multiple arbitrary calls in a single transaction
- **approveAndStake()**: Convenience function for common approve+stake pattern

Key implementation detail: This pattern can't be fully tested locally in Foundry since EIP-7702 delegation can't be simulated - the self-referential check will always fail in tests. Production testing requires actual on-chain deployment.

**Related files**: packages/contracts/src/BatchExecutor.sol, packages/contracts/test/BatchExecutor.t.sol
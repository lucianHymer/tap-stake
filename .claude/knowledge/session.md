### [19:43] [gotcha] Viem NFC Account Type and signAuthorization
**Details**: When creating a custom account object for viem (like NFC accounts), you must:
1. Include `type: 'local' as const` property - viem requires this to identify the account type
2. For EIP-7702's signAuthorization, call it directly on the account object, not through walletClient.signAuthorization() which expects different parameters
3. The account type error "Account type 'undefined' is not supported" indicates the missing type property
**Files**: packages/frontend/src/lib/nfc.ts, packages/frontend/src/pages/EIP7702NFC.tsx
---

### [20:28] [gotcha] BigInt JSON Serialization Error
**Details**: JSON.stringify cannot serialize BigInt values. When logging transaction parameters that include BigInt values (like parseEther results), must convert to string first using .toString() method. This commonly occurs when logging mint amounts, gas values, or other Wei values.
**Files**: packages/frontend/src/pages/EIP7702NFC.tsx
---

### [20:28] [gotcha] NFC Card Digest Format Requirements
**Details**: LibHalo's execHaloCmdWeb with 'digest' parameter requires the digest to be exactly 32 bytes when formatted as hex. The digest should be passed as a hex string starting with '0x' and containing exactly 64 hex characters (32 bytes). If the digest is not properly formatted, libhalo returns "Failed to decode command.digest parameter" error.
**Files**: packages/frontend/src/lib/nfc.ts
---

### [04:13] [architecture] EIP-7702 Relayer Architecture
**Details**: Implemented minimal Cloudflare Worker relayer for gasless EIP-7702 transactions. The relayer accepts signed authorizations from NFC cards and submits transactions on behalf of users.

Key implementation details:
- POST /relay endpoint accepts authorization + transaction details
- Relayer constructs transaction with authorizationList containing user's signed authorization
- Transaction sent to user's EOA address with relayer paying gas
- Chain configurable via CHAIN_ID environment variable
- Uses same viem version (2.37.5) as frontend for compatibility
- CORS enabled for development (accepts all origins)
- Detailed error responses for debugging

Transaction flow:
1. Frontend sends NFC-signed authorization to relayer
2. Relayer validates chain ID matches
3. Constructs transaction with from=relayer, to=user EOA, authorizationList=[authorization]
4. Signs with relayer's private key and submits
5. Returns transaction hash

Package structure at packages/relayer/:
- src/index.ts - Worker implementation
- wrangler.toml - Cloudflare configuration
- Uses wrangler for local dev and deployment

Future enhancements planned: access control, rate limiting, gas management, nonce tracking
**Files**: packages/relayer/src/index.ts, packages/relayer/wrangler.toml, packages/relayer/README.md
---

### [04:24] [frontend] EIP-7702 Relayer Integration Implementation
**Details**: Created EIP7702Relayed.tsx page that integrates with the gasless relayer service. Key changes from the direct NFC flow:
1. Single NFC tap - only signs authorization, no second tap for transaction
2. Sends signed authorization to relayer API at VITE_RELAYER_URL
3. Relayer pays all gas fees - truly gasless experience
4. Removed MetaMask/wallet connection requirement
5. Authorization payload converted to JSON-safe format (BigInt to string)
6. Mint function also uses relayer for gasless minting
7. UI highlights gasless benefits with green accents
8. Error handling includes relayer-specific failures
9. Production relayer deployed at: https://eip7702-relayer.lucianfiallos.workers.dev
**Files**: packages/frontend/src/pages/EIP7702Relayed.tsx, packages/frontend/.env, packages/frontend/src/App.tsx
---

### [15:36] [architecture] EIP-7702 StakerWallet Implementation
**Details**: Created StakerWallet contract for gasless staking via EIP-7702 delegation with ERC-7201 namespaced storage:

**Key Design Patterns:**
- ERC-7201 namespaced storage using assembly with `$` storage pointer convention
- Storage slot calculated as: keccak256(abi.encode(uint256(keccak256("stakerwallet.main")) - 1)) & ~bytes32(uint256(0xff))
- Actual slot: 0xf3eb2a05d627e0d8f655578323b722a8c5b2b37da7dffa80986448fef78f9d00
- Uses mapping(address => uint256) nonces in namespaced storage to prevent replay attacks and storage collisions

**EIP-712 Signature Flow:**
- DOMAIN_SEPARATOR uses implementation address (SELF) for wallet UX and phishing protection
- StakeAuthorization typehash: (address account, uint256 nonce, uint256 amount, uint256 deadline)
- Signature verification: recovered signer must equal address(this) (the delegated EOA)
- Nonces increment before external calls (CEI pattern)

**Security Features:**
- Deadline validation prevents expired signatures
- Approve exact amount then clear to zero after execution
- Custom errors for gas efficiency
- Event emission for off-chain tracking

**Testing Limitations:**
- Foundry cannot simulate EIP-7702 delegation semantics
- Tests verify signature construction, recovery, and basic logic
- Full end-to-end testing requires deployment to EIP-7702-enabled network (Optimism Sepolia)

Also renamed BatchExecutor to SelfBatchExecutor to clarify self-execution pattern.
**Files**: packages/contracts/src/StakerWallet.sol, packages/contracts/src/SelfBatchExecutor.sol, packages/contracts/test/StakerWallet.t.sol, packages/contracts/script/Deploy.s.sol
---

### [15:44] [deployment] StakerWallet gasless staking implementation
**Details**: Successfully implemented StakerWallet contract for EIP-7702 gasless staking with the following features:
- ERC-7201 namespaced storage to prevent storage collision on re-delegation
- EIP-712 typed signatures for secure user authorization
- Nonce-based replay protection with per-account nonces
- Approve exact amount needed and clear to zero after execution for safety
- Custom errors for gas efficiency
- StakeWithAuthorization function allows relayers to submit transactions on behalf of users
- Uses SELF immutable to capture implementation address at deployment
- Renamed BatchExecutor to SelfBatchExecutor to clarify the self-execution pattern

All tests passing (10 total: 2 for SelfBatchExecutor, 8 for StakerWallet)
**Files**: packages/contracts/src/StakerWallet.sol, packages/contracts/src/SelfBatchExecutor.sol, packages/contracts/script/Deploy.s.sol
---

### [15:49] [deployment] Optimism Sepolia Contract Deployment - Sep 30, 2025
**Details**: Successfully deployed all contracts to Optimism Sepolia (Chain ID: 11155420):

Contract Addresses:
- SelfBatchExecutor: 0x7Edd1EBd251eE6D943Ae64A20969Cf40a1aa236C
- TestERC20: 0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649
- Stake: 0x334559433296D9Dd9a861c200aFB1FEAF77388AA
- StakerWallet: 0xB9f60eb68B55396CEb1a0a347aEfA48AE6473F33 (NEW - gasless staking)

Gas used: ~2,318,835
Total cost: ~0.00000232 ETH

Frontend files updated with new addresses:
- packages/frontend/src/pages/EIP7702Experimental.tsx
- packages/frontend/src/pages/EIP7702NFC.tsx
- packages/frontend/src/pages/EIP7702Relayed.tsx

Note: Contract verification failed due to API key issue but contracts are functional on-chain.
**Files**: packages/contracts/DEPLOYED_ADDRESSES.md, packages/frontend/src/pages/EIP7702Experimental.tsx, packages/frontend/src/pages/EIP7702NFC.tsx, packages/frontend/src/pages/EIP7702Relayed.tsx
---

### [15:53] [architecture] StakerWallet gasless staking architecture
**Details**: StakerWallet contract enables gasless staking via EIP-7702 with a two-signature approach:
1. EIP-7702 Authorization: User signs authorization to delegate EOA to StakerWallet contract
2. EIP-712 Operation Signature: User signs the specific stake operation (amount, deadline, nonce)

Key differences from SelfBatchExecutor pattern:
- StakerWallet verifies the operation signature internally
- Uses EIP-712 typed data for better wallet UX
- Relayer calls stakeWithAuthorization() on the delegated EOA
- Contract enforces that signer == address(this) to ensure EOA owner authorization

The relayer needs to handle both:
- Generic mode: Authorization + arbitrary call data (for SelfBatchExecutor)  
- Stake mode: Authorization + operation signature for StakerWallet
**Files**: packages/contracts/src/StakerWallet.sol, node_modules/@tap-stake/relayer/src/index.ts
---

### [16:10] [gotcha] WebAuthn requires user gesture for NFC
**Details**: libhalo's execHaloCmdWeb uses WebAuthn under the hood, which requires a user gesture (click, tap, etc) to work. Automatically triggering NFC connection on page load via React Suspense causes a "The operation either timed out or was not allowed" error because there's no user gesture.

Solution: Show a "CONNECT NFC" button that users must click before initiating the NFC connection. The button click counts as a user gesture, allowing WebAuthn to work properly.

Error signature: "Failed to execute command. Error: The operation either timed out or was not allowed." from NFCOperationError.
**Files**: packages/frontend/src/lib/nfc.ts, packages/frontend/src/lib/nfcResource.ts, packages/frontend/src/App.tsx, packages/frontend/src/components/NFCPrompt.tsx
---


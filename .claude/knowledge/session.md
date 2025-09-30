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


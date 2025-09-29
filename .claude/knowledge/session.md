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


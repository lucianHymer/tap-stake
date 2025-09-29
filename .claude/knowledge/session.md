### [19:43] [gotcha] Viem NFC Account Type and signAuthorization
**Details**: When creating a custom account object for viem (like NFC accounts), you must:
1. Include `type: 'local' as const` property - viem requires this to identify the account type
2. For EIP-7702's signAuthorization, call it directly on the account object, not through walletClient.signAuthorization() which expects different parameters
3. The account type error "Account type 'undefined' is not supported" indicates the missing type property
**Files**: packages/frontend/src/lib/nfc.ts, packages/frontend/src/pages/EIP7702NFC.tsx
---


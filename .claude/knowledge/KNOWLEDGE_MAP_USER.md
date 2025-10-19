# 📚 Tap-Stake Knowledge Base

This knowledge base documents the Tap-Stake project - an NFC wallet application that enables gasless staking via EIP-7702 delegation.

## 🏗️ Architecture

### NFC Wallet Integration
**File**: [architecture/nfc-wallet-integration.md](architecture/nfc-wallet-integration.md)

Comprehensive documentation of the NFC wallet architecture, covering:
- LibHalo NFC card integration patterns
- EOA paymaster support options
- EIP-7702 implementation with NFC cards
- Relayer architecture for gasless transactions
- StakerWallet contract with ERC-7201 and EIP-712
- SelfBatchExecutor for generic delegated operations

## 📦 Dependencies

### LibHalo
**File**: [dependencies/libhalo.md](dependencies/libhalo.md)
- WebAuthn integration details
- Platform requirements for NFC support

### Foundry
**File**: [dependencies/foundry.md](dependencies/foundry.md)
- Smart contract development framework setup

## 🚀 Deployment

### EIP-7702 on Optimism Sepolia
**File**: [deployment/eip-7702-optimism-sepolia.md](deployment/eip-7702-optimism-sepolia.md)

Deployment configuration and current contract addresses:
- SelfBatchExecutor: 0x7Edd1EBd251eE6D943Ae64A20969Cf40a1aa236C
- TestERC20: 0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649
- Stake: 0x334559433296D9Dd9a861c200aFB1FEAF77388AA
- StakerWallet: 0xB9f60eb68B55396CEb1a0a347aEfA48AE6473F33

## 🎨 Frontend

### Demon Slayer Theme
**File**: [frontend/tap-stake-demon-slayer-theme.md](frontend/tap-stake-demon-slayer-theme.md)
- Dark themed UI with demon-slaying metaphors
- Visual design and interactive elements

### NFC Auto-Connect
**File**: [frontend/nfc-auto-connect-suspense.md](frontend/nfc-auto-connect-suspense.md)
- React Suspense pattern for NFC connection
- WebAuthn timing considerations

### EIP-7702 Viem Integration
**File**: [frontend/eip-7702-viem-integration.md](frontend/eip-7702-viem-integration.md)
- Client setup for EIP-7702 features
- Transaction flow and TypeScript compatibility

### Moloch Design System
**File**: [frontend/moloch-design-system.md](frontend/moloch-design-system.md)
- Pure token approach
- Component-owned styling philosophy

### Relayer Integration
**File**: [frontend/eip-7702-relayer-integration.md](frontend/eip-7702-relayer-integration.md)
- Gasless transaction flow
- Production relayer deployment

## 🧪 Testing

### EIP-7702 NFC Verification
**File**: [testing/eip-7702-nfc-verification.md](testing/eip-7702-nfc-verification.md)
- Signature verification tests
- EIP-7702 compatibility confirmation

## ⚠️ Gotchas & Common Issues

### WebAuthn Restrictions
**File**: [gotchas/webauthn-restrictions.md](gotchas/webauthn-restrictions.md)
- RP ID domain requirements
- NotAllowedError causes
- User gesture requirements for NFC

### NFC Signature Verification
**File**: [gotchas/nfc-signature-verification.md](gotchas/nfc-signature-verification.md)
- Message hashing details
- Ethereum prefix handling

### Viem NFC Integration
**File**: [gotchas/viem-nfc-integration.md](gotchas/viem-nfc-integration.md)
- Account type requirements
- BigInt JSON serialization
- NFC digest format requirements

---

## How to Use This Knowledge Base

Each document contains detailed information about its specific topic. Documents are organized by category and linked from this map for easy navigation.

For LLM agents: Use the `@` prefix with file paths when referencing these documents (e.g., `@architecture/nfc-wallet-integration.md`).

# 📚 Project Knowledge Map

*Last updated: 2025-11-01*

## 🏗️ Architecture
- [NFC Wallet Integration](architecture/nfc-wallet-integration.md) - LibHalo NFC patterns, EOA paymaster support, EIP-7702 NFC implementation with signAuthorization, two-tap demo flow, approve+transfer batching, frontend integration strategy, BatchExecutor pattern

## 🔌 API
- [Relayer Test Mint Endpoint](api/relayer-test-mint.md) - Test endpoint for minting TestERC20 tokens on Optimism Sepolia

## 📦 Dependencies
- [LibHalo NFC Library](dependencies/libhalo.md) - WebAuthn integration and platform requirements
- [Foundry](dependencies/foundry.md) - Smart contract development framework installation and setup

## 🚀 Deployment
- [EIP-7702 Optimism Sepolia](deployment/eip-7702-optimism-sepolia.md) - Deployment configuration for EIP-7702 contracts on OP Sepolia, deployed contract addresses (SelfBatchExecutor, TestERC20, StakerWallet, StakeChoicesERC6909), relayer configuration with supported operations

## 🎨 Frontend
- [Tap-Stake Demon-Slayer Theme](frontend/tap-stake-demon-slayer-theme.md) - Dark themed UI with demon-slaying metaphors
- [NFC Auto-Connect Suspense](frontend/nfc-auto-connect-suspense.md) - React Suspense pattern for automatic NFC connection
- [EIP-7702 Viem Integration](frontend/eip-7702-viem-integration.md) - Viem client integration for EIP-7702 delegation features

## 🎯 Patterns
- [ABI Organization Pattern](patterns/abi-organization.md) - Separating standard and test-specific ABIs for clean contract interfaces

## 🧪 Testing
- [EIP-7702 NFC Verification](testing/eip-7702-nfc-verification.md) - Signature verification confirming NFC implementation compatibility with EIP-7702
- [Relayer Unit Testing Strategy](testing/relayer-unit-testing.md) - Vitest-based unit testing with stubbed blockchain interactions

## ⚠️ Gotchas
- [WebAuthn Restrictions](gotchas/webauthn-restrictions.md) - RP ID limitations and NotAllowedError causes
- [NFC Signature Verification](gotchas/nfc-signature-verification.md) - Message hashing and Ethereum prefix handling
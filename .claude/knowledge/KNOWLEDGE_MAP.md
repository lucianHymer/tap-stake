# 📚 Project Knowledge Map

*Last updated: 2025-11-01*

## 🏗️ Architecture
- [NFC Wallet Integration](architecture/nfc-wallet-integration.md) - LibHalo NFC patterns, EOA paymaster support, EIP-7702 NFC implementation with signAuthorization, two-tap demo flow, approve+transfer batching, frontend integration strategy, SelfBatchExecutor pattern, EIP-7702 relayer architecture, StakerWallet implementation with ERC-7201 and EIP-712

## 📦 Dependencies
- [LibHalo NFC Library](dependencies/libhalo.md) - WebAuthn integration and platform requirements
- [Foundry](dependencies/foundry.md) - Smart contract development framework installation and setup

## 🚀 Deployment
- [EIP-7702 Optimism Sepolia](deployment/eip-7702-optimism-sepolia.md) - Deployment configuration for EIP-7702 contracts on OP Sepolia, deployed contract addresses (SelfBatchExecutor, TestERC20, Stake, StakerWallet)

## 🎨 Frontend
- [Tap-Stake Demon-Slayer Theme](frontend/tap-stake-demon-slayer-theme.md) - Dark themed UI with demon-slaying metaphors
- [NFC Auto-Connect Suspense](frontend/nfc-auto-connect-suspense.md) - React Suspense pattern for automatic NFC connection
- [EIP-7702 Viem Integration](frontend/eip-7702-viem-integration.md) - Viem client integration for EIP-7702 delegation features
- [Moloch Design System](frontend/moloch-design-system.md) - Pure token approach with consolidated CSS file
- [EIP-7702 Relayer Integration](frontend/eip-7702-relayer-integration.md) - Gasless transaction flow via Cloudflare Worker relayer

## 🎯 Patterns
- [Framer Motion Animations](patterns/framer-motion-animations.md) - LazyMotion bundle optimization and spring-based counter animations
- [Type-Safe Stats](patterns/type-safe-stats.md) - Separation of data model and display logic for stats

## 🧪 Testing
- [EIP-7702 NFC Verification](testing/eip-7702-nfc-verification.md) - Signature verification confirming NFC implementation compatibility with EIP-7702

## ⚠️ Gotchas
- [WebAuthn Restrictions](gotchas/webauthn-restrictions.md) - RP ID limitations, NotAllowedError causes, user gesture requirements for NFC
- [NFC Signature Verification](gotchas/nfc-signature-verification.md) - Message hashing and Ethereum prefix handling
- [Viem NFC Integration](gotchas/viem-nfc-integration.md) - Account type requirements, BigInt JSON serialization, NFC digest format
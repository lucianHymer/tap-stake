# 📚 Project Knowledge Map

## 🏗️ Architecture
- @architecture/nfc-wallet-integration.md - LibHalo NFC patterns, EOA paymaster support, EIP-7702 NFC implementation with signAuthorization, two-tap demo flow, approve+transfer batching, frontend integration strategy, SelfBatchExecutor pattern, EIP-7702 relayer architecture, StakerWallet implementation with ERC-7201 and EIP-712

## 🔌 API
- @api/relayer-test-mint.md - Test endpoint for minting TestERC20 tokens on Optimism Sepolia

## 📦 Dependencies
- @dependencies/libhalo.md - WebAuthn integration and platform requirements
- @dependencies/foundry.md - Smart contract development framework installation and setup

## 🚀 Deployment
- @deployment/eip-7702-optimism-sepolia.md - Deployment configuration for EIP-7702 contracts on OP Sepolia, deployed contract addresses (SelfBatchExecutor, TestERC20, StakerWallet, StakeChoicesERC6909), relayer configuration with supported operations

## 🎨 Frontend
- @frontend/tap-stake-demon-slayer-theme.md - Dark themed UI with demon-slaying metaphors
- @frontend/nfc-auto-connect-suspense.md - React Suspense pattern for automatic NFC connection
- @frontend/eip-7702-viem-integration.md - Viem client integration for EIP-7702 delegation features
- @frontend/moloch-design-system.md - Pure token approach with component-owned styling
- @frontend/eip-7702-relayer-integration.md - Gasless transaction flow via Cloudflare Worker relayer

## 🎯 Patterns
- @patterns/abi-organization.md - Separating standard and test-specific ABIs for clean contract interfaces

## 🧪 Testing
- @testing/eip-7702-nfc-verification.md - Signature verification confirming NFC implementation compatibility with EIP-7702
- @testing/relayer-unit-testing.md - Vitest-based unit testing with stubbed blockchain interactions

## ⚠️ Gotchas
- @gotchas/webauthn-restrictions.md - RP ID limitations, NotAllowedError causes, user gesture requirements for NFC
- @gotchas/nfc-signature-verification.md - Message hashing and Ethereum prefix handling
- @gotchas/viem-nfc-integration.md - Account type requirements, BigInt JSON serialization, NFC digest format
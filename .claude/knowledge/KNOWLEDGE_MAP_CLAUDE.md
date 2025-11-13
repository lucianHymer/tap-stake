# 📚 Project Knowledge Map

## 🏗️ Architecture
- @architecture/nfc-wallet-integration.md - LibHalo NFC patterns, EOA paymaster support, EIP-7702 NFC implementation with signAuthorization, two-tap demo flow, approve+transfer batching, frontend integration strategy, SelfBatchExecutor pattern, EIP-7702 relayer architecture, StakerWallet implementation with ERC-7201 and EIP-712, NFC Key Slot 8 password protection

## 🔌 API
- @api/relayer-test-mint.md - Test endpoint for minting TestERC20 tokens on Optimism Sepolia

## ⚙️ Config
- @config/centralized-chain-configuration.md - VITE_CHAIN_ID-driven chain configuration for easy network switching

## 📦 Dependencies
- @dependencies/libhalo.md - WebAuthn integration and platform requirements
- @dependencies/foundry.md - Smart contract development framework installation and setup

## 🚀 Deployment
- @deployment/eip-7702-optimism-sepolia.md - Deployment configuration for EIP-7702 contracts on OP Sepolia, deployed contract addresses (SelfBatchExecutor, TestERC20, StakerWallet, StakeChoicesERC6909), relayer configuration with supported operations

## 🎨 Frontend
- @frontend/tap-stake-demon-slayer-theme.md - Dark themed UI with demon-slaying metaphors
- @frontend/nfc-auto-connect-suspense.md - React Suspense pattern for automatic NFC connection
- @frontend/eip-7702-viem-integration.md - Viem client integration for EIP-7702 delegation features
- @frontend/moloch-design-system.md - Pure token approach with consolidated CSS file
- @frontend/eip-7702-relayer-integration.md - Gasless transaction flow via Cloudflare Worker relayer
- @frontend/stats-page-etherscan.md - Client-side Etherscan API queries for relayer activity and ERC6909 token totals
- @frontend/nfc-status-message-timing.md - Improved user feedback timing for NFC interactions

## 🎯 Patterns
- @patterns/framer-motion-animations.md - LazyMotion bundle optimization, spring-based counter animations, and hint animation pattern for teaching affordances
- @patterns/type-safe-stats.md - Separation of data model and display logic for stats
- @patterns/abi-organization.md - Separating standard and test-specific ABIs for clean contract interfaces
- @patterns/stats-display-bars.md - D&D/video-game style character stats with horizontal bar graph visualization

## 🧪 Testing
- @testing/eip-7702-nfc-verification.md - Signature verification confirming NFC implementation compatibility with EIP-7702
- @testing/relayer-unit-testing.md - Vitest-based unit testing with stubbed blockchain interactions

## ⚠️ Gotchas
- @gotchas/webauthn-restrictions.md - RP ID limitations, NotAllowedError causes, user gesture requirements for NFC
- @gotchas/nfc-signature-verification.md - Message hashing and Ethereum prefix handling
- @gotchas/viem-nfc-integration.md - Account type requirements, BigInt JSON serialization, NFC digest format

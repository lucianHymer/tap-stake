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
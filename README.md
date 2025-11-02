# Tap-Stake 🔥

A gasless staking application where users tap NFC cards to stake tokens without paying gas fees. Built with EIP-7702 delegation and deployed on Optimism.

## What is this?

Tap-Stake demonstrates gasless blockchain interactions using NFC card wallets. Users can stake tokens across multiple choices, manage their positions, and withdraw—all without needing ETH for gas. A relayer sponsors transactions using EIP-7702's temporary code delegation.

**Theme:** Demon-slayer aesthetic where staking defeats Moloch, the demon of discoordination.

## Key Features

- **NFC Wallet Support**: Sign transactions by tapping NFC cards (via LibHalo)
- **Gasless Transactions**: Relayer pays all gas fees using EIP-7702 delegation
- **Multi-Choice Staking**: Stake across 6 different choices using ERC6909 multi-token standard
- **Flexible Operations**: Add stakes, update allocations, withdraw, or unstake-and-withdraw in one tap
- **Stats Dashboard**: View relayer activity and total staked amounts via Etherscan API
- **Dark Theme**: Moloch design system with demon-slaying UI

## Project Structure

```
tap-stake/
├── packages/
│   ├── contracts/          # Solidity contracts (Foundry)
│   │   ├── StakerWallet.sol          # EIP-7702 gasless staking
│   │   ├── StakeChoicesERC6909.sol   # Multi-token staking
│   │   └── TestERC20.sol             # Test token
│   ├── frontend/           # React app (Vite + TypeScript)
│   │   ├── src/pages/
│   │   │   ├── ChoicesPage.tsx       # Stake allocation
│   │   │   ├── WithdrawPage.tsx      # Withdraw tokens
│   │   │   ├── StatsPage.tsx         # View statistics
│   │   │   └── ConnectPage.tsx       # NFC connection
│   │   └── src/lib/nfc.ts            # NFC integration
│   └── relayer/            # Cloudflare Worker
│       └── src/index.ts              # Gasless transaction relayer
```

## Quick Start

### Prerequisites
- Node.js 18+
- NFC-enabled device (Android phone or desktop with NFC reader + HaLo Bridge)
- Initialized HaLo NFC card

### Run Locally

```bash
# Install dependencies
npm install

# Start frontend
npm run dev
```

Visit `http://localhost:5173`

### Deployed Contracts (Optimism Sepolia)

| Contract | Address |
|----------|---------|
| TestERC20 | `0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756` |
| StakeChoicesERC6909 | `0xb0a727f57841910752F0f1ef96871Cc28C086012` |
| StakerWallet | `0x0568033352086AD7Bc23B218D8b9ff6733BA4448` |

See [DEPLOYED_ADDRESSES.md](packages/contracts/DEPLOYED_ADDRESSES.md) for full details.

## How It Works

1. **Connect**: Tap NFC card to connect your wallet
2. **Choose Stakes**: Allocate tokens across 6 choices (charisma, intelligence, wisdom, etc.)
3. **Sign**: Tap card to sign EIP-7702 authorization and operation signature
4. **Relay**: Relayer submits transaction and pays gas
5. **Done**: Stakes updated without spending any ETH

### Technical Flow

```
User NFC Card → Signs Authorization (EIP-7702)
                     ↓
              Signs Operation (EIP-712)
                     ↓
              Sends to Relayer
                     ↓
         Relayer Verifies & Submits
                     ↓
          Transaction Executes Gaslessly
```

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Viem 2.37 for Ethereum interactions
- LibHalo for NFC card communication
- Framer Motion for animations
- Moloch design tokens

**Contracts:**
- Solidity 0.8.30
- Foundry for development
- EIP-7702 for delegation
- ERC6909 for multi-token staking
- EIP-712 for typed signatures

**Relayer:**
- Cloudflare Workers
- Viem for transaction submission
- CORS-enabled for browser requests

## Development

### Build Tokens
```bash
cd packages/frontend
npm run build:tokens
```

### Run Tests (Contracts)
```bash
cd packages/contracts
forge test
```

### Run Tests (Relayer)
```bash
cd packages/relayer
npm test
```

### Deploy Contracts
```bash
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url optimism_sepolia --broadcast --verify
```

## Documentation

- [Architecture Overview](.claude/knowledge/KNOWLEDGE_MAP_CLAUDE.md)
- [EIP-7702 Integration](.claude/knowledge/architecture/nfc-wallet-integration.md)
- [Mainnet Deployment Guide](MAINNET_DEPLOYMENT.md)
- [Design System](packages/frontend/design-system/)

## Contributing

This project uses:
- **Biome** for linting and formatting (`npm run check:write`)
- **Git hooks** for pre-commit checks (`npm run install-hooks`)

## License

MIT

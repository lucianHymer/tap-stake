# Tap-Stake NFC Wallet

A proof-of-concept application that uses NFC card wallets (via libhalo) to sign messages and transactions on Optimism.

## Quick Start

### Prerequisites
- Node.js 18+
- NFC-enabled device (Android phone or desktop with NFC reader)
- Chrome browser with Web NFC API support
- Initialized HaLo NFC card with ECDSA keys

### Installation & Running

```bash
# From the root directory
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
tap-stake/
├── packages/
│   ├── frontend/         # React frontend app
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   └── nfc.ts     # NFC interface layer
│   │   │   ├── App.tsx        # Main app component
│   │   │   └── App.css        # Styling
│   │   └── package.json
│   └── contracts/        # Foundry smart contracts (Phase 2)
│       └── README.md     # Contract setup instructions
└── package.json          # Root workspace config
```

## Features (Phase 1 - MVP)

- ✅ Read NFC card address
- ✅ Sign messages with NFC card
- ✅ Verify signatures
- ✅ Display signed messages and addresses
- ✅ Error handling for NFC failures

## How to Use

1. **Open the app** in Chrome on an NFC-enabled device
2. **Click "Read NFC Card"** and tap your initialized HaLo card
3. **Click "Sign Message"** and tap your card again to sign
4. **View the signature** and verification result

## Technical Details

- **libhalo**: Handles NFC card communication
- **viem**: Ethereum library for signature handling
- **React + TypeScript**: Frontend framework
- **Vite**: Build tool for fast development

## Next Steps (Phase 2)

- EIP-7702 support for gasless transactions
- Smart contract deployment for delegation
- Paymaster integration for sponsored transactions

## Development

To work on the frontend:

```bash
cd packages/frontend
npm run dev  # Hot reload enabled
```

To set up contracts (requires Foundry):

```bash
cd packages/contracts
forge init --no-commit .
```

## Troubleshooting

- **NFC not working**: Ensure Chrome has NFC permissions and your device supports Web NFC API
- **Card not reading**: Check that your HaLo card is properly initialized with ECDSA keys
- **Signature verification failing**: Ensure the card's key slot 1 is configured correctly
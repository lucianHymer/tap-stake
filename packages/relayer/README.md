# EIP-7702 Transaction Relayer

A minimal Cloudflare Worker that accepts EIP-7702 authorizations and submits transactions on behalf of users, enabling gasless transactions.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure secrets

Set the following secrets using wrangler:

```bash
# Relayer's private key (pays for gas)
wrangler secret put PRIVATE_KEY

# RPC endpoint URL (e.g., https://sepolia.optimism.io)
wrangler secret put RPC_URL

# Chain ID (e.g., 11155420 for OP Sepolia)
wrangler secret put CHAIN_ID
```

### 3. Local development

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`

### 4. Deploy to Cloudflare

```bash
npm run deploy
```

## API

### POST /relay

Submit a transaction with an EIP-7702 authorization.

**Request:**
```json
{
  "authorization": {
    "contractAddress": "0x...",
    "chainId": 11155420,
    "nonce": "0",
    "r": "0x...",
    "s": "0x...",
    "yParity": 0
  },
  "to": "0x...",
  "data": "0x...",
  "value": "0"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "details": {
    "relayer": "0x...",
    "chainId": 11155420,
    "to": "0x..."
  }
}
```

## How it works

1. User signs an EIP-7702 authorization with their NFC card
2. Frontend sends the authorization to this relayer
3. Relayer constructs a transaction with:
   - `from`: Relayer's address (pays gas)
   - `to`: User's EOA address
   - `authorizationList`: User's signed authorization
   - `data`: The delegated call data
4. Transaction is sent to the chain
5. User's EOA executes the delegated logic without paying gas

## Security Notes

This is a minimal implementation. Production deployments should add:
- Access control (allowlist of addresses)
- Rate limiting
- Gas price management
- Nonce management for concurrent requests
- Request validation and sanitization
# EIP-7702 StakerWallet Relayer

A Cloudflare Worker that accepts EIP-7702 authorizations and submits StakerWallet transactions on behalf of users, enabling gasless staking operations with anti-spam protection.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure secrets and environment variables

**Secrets** (set using `wrangler secret put`):
```bash
# Relayer's private key (pays for gas)
wrangler secret put PRIVATE_KEY
```

**Environment variables** (set in `wrangler.toml`):
```toml
[vars]
ENVIRONMENT = "development"
CHAIN_ID = "11155420"  # OP Sepolia
RPC_URL = "https://sepolia.optimism.io"
ALLOWED_CONTRACT_ADDRESS = "0x..."  # StakerWallet contract address
TOKEN_ADDRESS = "0x..."  # ERC20 token being staked (e.g., GTC)
STAKE_CHOICES_ADDRESS = "0x..."  # StakeChoicesERC6909 contract address
MINIMUM_HOLDINGS = "90000000000000000000"  # 90 tokens in wei (90e18)
APPROVED_CHOICE_IDS = "123,456,789"  # Comma-separated choice IDs
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

### POST /

Submit a StakerWallet transaction with an EIP-7702 authorization.

All operations require:
- Valid EIP-7702 authorization
- User has at least 90 tokens (wallet balance + staked balance)
- Choice IDs are in the approved list

---

#### 1. Add Stakes

Stake tokens to multiple choices.

**Request:**
```json
{
  "operation": "addStakes",
  "authorization": {
    "address": "0x...",
    "chainId": 11155420,
    "nonce": "0",
    "r": "0x...",
    "s": "0x...",
    "yParity": 0
  },
  "choiceIds": ["123", "456"],
  "amounts": ["1000000000000000000", "2000000000000000000"]
}
```

**Validations:**
- All amounts must be > 0
- Total amount must be ≤ 1000 tokens
- All choice IDs must be in approved list

---

#### 2. Update Stakes

Atomically remove old stakes and add new stakes.

**Request:**
```json
{
  "operation": "updateStakes",
  "authorization": { ... },
  "oldChoiceIds": ["123", "456"],
  "oldAmounts": ["1000000000000000000", "2000000000000000000"],
  "newChoiceIds": ["789"],
  "newAmounts": ["3000000000000000000"]
}
```

**Validations:**
- All old/new amounts must be > 0 (if provided)
- Total new amount must be ≤ 1000 tokens
- All choice IDs must be in approved list
- Old choice IDs/amounts are optional (can just add new stakes)

---

#### 3. Withdraw

Withdraw up to 100 tokens from wallet to recipient.

**Request:**
```json
{
  "operation": "withdraw",
  "authorization": { ... },
  "recipient": "0x..."
}
```

**Validations:**
- Wallet balance must be > 0
- Recipient address required

---

#### 4. Unstake All and Withdraw

Remove all stakes and withdraw tokens in one transaction.

**Request:**
```json
{
  "operation": "unstakeAllAndWithdraw",
  "authorization": { ... },
  "choiceIds": ["123", "456"],
  "amounts": ["1000000000000000000", "2000000000000000000"],
  "recipient": "0x..."
}
```

**Validations:**
- All amounts must be > 0
- All choice IDs must be in approved list
- Recipient address required

---

**Success Response (all operations):**
```json
{
  "success": true,
  "txHash": "0x...",
  "details": {
    "relayer": "0x...",
    "chainId": 11155420,
    "eoa": "0x...",
    "delegatedTo": "0x...",
    "operation": "addStakes",
    "choiceIds": ["123", "456"],
    "amounts": ["1000000000000000000", "2000000000000000000"]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Insufficient holdings",
  "details": {
    "message": "Must have at least 90 tokens",
    "totalHoldings": "50000000000000000000",
    "minimumRequired": "90000000000000000000"
  }
}
```

## How it works

1. User signs an EIP-7702 authorization with their NFC card
2. Frontend sends the authorization + operation details to this relayer
3. Relayer validates:
   - Authorization signature is valid
   - User has at least 90 tokens (wallet + staked balances)
   - All amounts are non-zero (gas optimization)
   - Choice IDs are in the approved list
   - Operation-specific requirements
4. Relayer constructs a transaction with:
   - `from`: Relayer's address (pays gas)
   - `to`: User's EOA address
   - `authorizationList`: User's signed authorization
   - `data`: Encoded StakerWallet function call
5. Transaction is sent to the chain
6. User's EOA executes the StakerWallet logic without paying gas

## Security Features

Built-in protections:
- ✅ **Contract address restriction**: Only delegates to the configured StakerWallet contract
- ✅ **Chain ID validation**: Ensures authorization matches the relayer's chain
- ✅ **Minimum holdings check**: Users must have ≥90 tokens (anti-spam/sybil)
- ✅ **Choice ID allowlist**: Only approved choice IDs can be staked
- ✅ **Zero-amount prevention**: All amounts must be > 0 (prevents wasted gas)
- ✅ **Maximum stake limit**: Total stake per transaction ≤ 1000 tokens
- ✅ **Balance verification**: Checks wallet balance before withdraw operations

Additional production considerations:
- Rate limiting per user address
- Gas price management and monitoring
- Nonce management for concurrent requests
- Enhanced logging and monitoring
- Multi-signature relayer key management
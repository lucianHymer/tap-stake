# User Flow Refactor Implementation Guide

## 📋 Executive Summary

This document outlines the refactoring of the Tap-Stake application's user flow from disconnected test pages into a cohesive, production-ready gasless staking experience. The application allows users to stake GTC tokens across 6 different choices using NFC cards or generated wallets, with all gas fees sponsored by a relayer service.

## 🎯 Project Goals

1. **Transform test pages into production flow** - Convert `/test`, `/test2`, `/test3`, `/test4` into a connected user experience
2. **Support both NFC and generated wallets** - Allow users with or without burner cards to participate
3. **Implement smart staking logic** - Handle first-time staking, restaking, and withdrawals appropriately
4. **Maintain gasless experience** - All operations sponsored through EIP-7702 relayer
5. **Preserve demon-slayer theme** - Keep the existing dramatic UI design intact

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Blockchain**: Optimism Sepolia (Chain ID: 11155420)
- **Smart Contracts**: EIP-7702 StakerWallet + ERC6909 multi-token staking
- **Relayer**: Cloudflare Worker at `https://eip7702-relayer.lucianhymer.workers.dev`
- **NFC Integration**: LibHalo for card reading and signing

### Key Contract Addresses
```typescript
const CONTRACTS = {
  testToken: "0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756",
  stakeChoicesToken: "0xb0a727f57841910752F0f1ef96871Cc28C086012",
  stakerWallet: "0x0568033352086AD7Bc23B218D8b9ff6733BA4448"
};
```

### Choice ID Mapping
The 6 staking choices map to specific deterministic IDs in the smart contract:

```typescript
const CHOICE_ID_MAPPING = {
  'giveth':      '99921030434853126453340568019546123113290951926625281747676119336391366179676',
  'karma':       '103467882007752256716465905423493267637639752828754828952501832282292424221652',
  'gardens':     '37022085098767960322629082668856854414683424180269164484809959024879061362464',
  'deepfunding': '102590855234691522285546861392190170000582855349844279089213381909182907084793',
  'privote':     '113654052384035540339254108331114608443394203971279322386708763587320017623119',
  'silvi':       '26590924299719391955823896655943307388838177793986195267126087681677919884365'
};
```

## 📊 Current State Analysis

### Existing Test Pages
1. **Test.tsx** → ConnectCard component (will become root `/`)
2. **Test2.tsx** → ChoicesCard component (will become `/choices`)
3. **Test3.tsx** → SlainCard component (will become `/slain`)
4. **Test4.tsx** → MolochRisesCard component (will become `/withdraw`)

### Relayer Capabilities
The relayer supports 4 operations:
- **addStakes**: First-time staking
- **updateStakes**: Reallocation of existing stakes
- **withdraw**: Withdraw wallet balance only
- **unstakeAllAndWithdraw**: Complete exit with all funds

### Current Issues
- Pages are disconnected - no state management between them
- No balance checking implementation
- Hardcoded 100 GTC amount instead of dynamic calculation
- No transaction status/error handling
- No support for generated wallets

## 🔄 New User Flow

### Flow Diagram
```
/test (Entry Point)
    ├── "I have a burner card"
    │   ├── Tap NFC to connect
    │   ├── Check total holdings (wallet + stakes)
    │   ├── Top up to 100 GTC if needed
    │   └── Redirect to /
    │
    └── "I don't have a burner"
        ├── Generate private key
        ├── Mint 100 GTC
        └── Redirect to /

/ (Connect Page)
    ├── Check if user has existing stakes
    ├── Has stakes → /slain (show current allocation)
    └── No stakes → /choices

/choices (Selection Page)
    ├── Display available amount: min(wallet + stakes, 100 GTC)
    ├── User selects 1-6 choices
    ├── "Slay Moloch" → Sign with NFC/wallet → Submit to relayer
    │   ├── Success → /slain
    │   └── Error → Show error message
    └── "Run Away" → /withdraw

/slain (Success Page)
    ├── Show "You staked X GTC on these Y choices"
    ├── List each choice with amount
    ├── Display earned class
    └── "Start Over" → /choices (with pre-selected choices)

/withdraw (Exit Page)
    ├── Input destination address
    └── Submit
        ├── No stakes → withdraw()
        └── Has stakes → unstakeAllAndWithdraw()
```

## 💻 Implementation Details

### 1. Global State Management

Create a context provider or state management solution to share data between pages:

```typescript
// src/contexts/AppContext.tsx
interface AppState {
  // Connection
  connectedAddress: `0x${string}` | null;
  account: Account | null; // NFC or generated private key account
  isGeneratedWallet: boolean;

  // Balances
  walletBalance: bigint;
  existingStakes: Map<string, bigint>; // choiceName → amount

  // User selections (persisted between pages)
  selectedChoices: Set<string>; // choice names (giveth, karma, etc)

  // Transaction state
  transactionStatus: 'idle' | 'signing' | 'submitting' | 'success' | 'error';
  transactionError: string | null;
  txHash: string | null;
}

const AppContext = createContext<{
  state: AppState;
  actions: AppActions;
}>(null);
```

### 2. Test Page Implementation

**IMPORTANT**: The top-up to 100 GTC functionality is ONLY for users who choose "I have a burner card" on this test page. This ensures existing users can test with a full 100 GTC. Users in the main flow (starting from `/`) will NOT receive any top-up - they work with their existing balance.

```typescript
// src/pages/TestPage.tsx
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { parseEther, formatEther } from 'viem';

const TestPage = () => {
  const { actions } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleBurnerCard = async () => {
    setLoading(true);
    try {
      // 1. Connect NFC card
      const { address, account } = await connectNFC();

      // 2. Check current holdings (wallet + all stakes)
      const walletBalance = await publicClient.readContract({
        address: CONTRACTS.testToken,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address]
      });

      const stakes = await checkAllStakes(address);
      const totalStaked = Array.from(stakes.values())
        .reduce((sum, amt) => sum + amt, 0n);
      const totalHoldings = walletBalance + totalStaked;

      // 3. Top up to 100 GTC if needed (ONLY for test page users)
      const target = parseEther('100');
      if (totalHoldings < target) {
        const mintAmount = target - totalHoldings;
        await fetch(`${RELAYER_URL}/test-mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            amount: mintAmount.toString()
          })
        });
        console.log(`Topped up ${formatEther(mintAmount)} GTC to reach 100 total`);
      }

      // 4. Store in app state and navigate
      actions.setConnection({ address, account, isGeneratedWallet: false });
      navigate('/');
    } catch (error) {
      console.error('Failed to connect burner card:', error);
    }
    setLoading(false);
  };

  const handleNoCard = async () => {
    setLoading(true);
    try {
      // 1. Generate new wallet
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);

      // 2. Mint 100 GTC
      await fetch(`${RELAYER_URL}/test-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: account.address,
          amount: parseEther('100').toString()
        })
      });

      // 3. Store in app state and navigate
      actions.setConnection({
        address: account.address,
        account,
        isGeneratedWallet: true
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to generate wallet:', error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.testPage}>
      <h1>Welcome to Tap-Stake</h1>
      <p>Choose your path:</p>

      <div className={styles.options}>
        <Button onClick={handleBurnerCard} disabled={loading}>
          I have a burner card
        </Button>

        <Button onClick={handleNoCard} disabled={loading}>
          I don't have a burner
        </Button>
      </div>
    </div>
  );
};
```

### 3. Connect Page Updates

```typescript
// src/pages/ConnectPage.tsx
const ConnectPage = () => {
  const { state, actions } = useAppContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      let address: string;
      let account: Account;

      if (state.isGeneratedWallet) {
        // Use stored generated wallet
        address = state.connectedAddress!;
        account = state.account!;
      } else {
        // Connect NFC
        const connection = await connectNFC();
        address = connection.address;
        account = connection.account;
      }

      // Check balances
      const balances = await checkBalances(address);
      actions.setBalances(balances);

      // Navigate based on existing stakes
      if (balances.existingStakes.size > 0) {
        navigate('/slain');
      } else {
        navigate('/choices');
      }
    } catch (error) {
      // Show error message below the button
      if (error.message.includes('WebAuthn')) {
        setError('Card reader not detected. Please connect your HaLo Bridge.');
      } else if (error.message.includes('timeout')) {
        setError('Connection timed out. Please try again.');
      } else if (error.message.includes('network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to connect. Please try again.');
      }
    }

    setIsConnecting(false);
  };

  return (
    <GameCard variant="connect">
      {/* Existing ConnectCard content */}
      <Button
        className={styles.connectButton}
        onClick={handleConnect}
        disabled={isConnecting}
      >
        <span className={`${styles.buttonText} ${isConnecting ? styles.buttonTextHidden : ''}`}>
          Connect
        </span>
        {isConnecting && (
          <span className={styles.buttonTextOverlay}>
            Communing...
          </span>
        )}
      </Button>

      {/* Error message display */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </GameCard>
  );
};
```

### 4. Balance Checking Implementation

```typescript
// src/utils/balances.ts
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  }
] as const;

const ERC6909_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  }
] as const;

export const checkBalances = async (address: string) => {
  // Check wallet balance
  const walletBalance = await publicClient.readContract({
    address: CONTRACTS.testToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address]
  });

  // Check all 6 stake positions
  const existingStakes = new Map<string, bigint>();

  for (const [choiceName, choiceId] of Object.entries(CHOICE_ID_MAPPING)) {
    const balance = await publicClient.readContract({
      address: CONTRACTS.stakeChoicesToken,
      abi: ERC6909_ABI,
      functionName: 'balanceOf',
      args: [address, BigInt(choiceId)]
    });

    if (balance > 0n) {
      existingStakes.set(choiceName, balance);
    }
  }

  return { walletBalance, existingStakes };
};
```

### 5. Choices Page Transaction Handling

```typescript
// src/pages/ChoicesPage.tsx
const ChoicesPage = () => {
  const { state, actions } = useAppContext();
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'signing' | 'submitting' | 'error'>('idle');
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Calculate available amount dynamically
  const calculateAvailableAmount = () => {
    const totalStaked = Array.from(state.existingStakes.values())
      .reduce((sum, amount) => sum + amount, 0n);
    const total = state.walletBalance + totalStaked;
    const max = parseEther('100');
    return total > max ? max : total;
  };

  const handleSlayMoloch = async () => {
    setTransactionStatus('signing');
    setTransactionError(null);

    try {
      // 1. Sign authorization with NFC or generated wallet
      let authorization;
      if (state.isGeneratedWallet) {
        // Sign with generated wallet
        authorization = await state.account.signAuthorization({
          contractAddress: CONTRACTS.stakerWallet,
          chainId: 11155420,
          nonce: 0n
        });
      } else {
        // Sign with NFC
        const account = createNFCAccount(state.connectedAddress);
        authorization = await account.signAuthorization({
          contractAddress: CONTRACTS.stakerWallet,
          chainId: 11155420,
          nonce: 0n
        });
      }

      setTransactionStatus('submitting');

      // 2. Prepare staking data
      const stakingData = prepareStakingData(
        state.selectedChoices,
        state.existingStakes,
        calculateAvailableAmount()
      );

      // 3. Submit to relayer
      const response = await fetch(`${RELAYER_URL}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization: {
            ...authorization,
            yParity: authorization.yParity.toString(),
            nonce: '0'
          },
          operation: stakingData.operation,
          ...stakingData
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { txHash } = await response.json();
      actions.setTransactionHash(txHash);
      navigate('/slain');

    } catch (error) {
      setTransactionStatus('error');
      setTransactionError(error.message);
    }
  };

  return (
    <GameCard variant="choices">
      {transactionStatus === 'idle' ? (
        <>
          {/* Normal choice toggles */}
          <div className={styles.choices}>
            {CHOICES.map(choice => (
              <ChoiceToggle
                key={choice.id}
                id={choice.id}
                name={choice.name}
                stats={choice.stats}
                selected={state.selectedChoices.has(choice.id)}
                onToggle={(selected) => actions.toggleChoice(choice.id, selected)}
                amount={calculateAmountForChoice(choice.id)}
                hasExistingStake={state.existingStakes.has(choice.id)}
              />
            ))}
          </div>

          <div className={styles.actions}>
            <Button onClick={handleSlayMoloch}>Slay Moloch</Button>
            <Button onClick={() => navigate('/withdraw')}>Run Away</Button>
          </div>
        </>
      ) : (
        <TransactionStatus
          status={transactionStatus}
          error={transactionError}
          onClose={() => setTransactionStatus('idle')}
        />
      )}
    </GameCard>
  );
};
```

### 6. Transaction Status Component

```typescript
// src/components/TransactionStatus.tsx
const TransactionStatus = ({ status, error, onClose }) => {
  const getReadableError = (error: string): string => {
    const errorMap: Record<string, string> = {
      'Insufficient holdings': 'Your offering is too meager. You need at least 90 GTC.',
      'Invalid signature': 'The blood pact was corrupted. Tap your card again.',
      'Network error': 'The ethereal connection faltered. Try again.',
      'Transaction failed': 'Moloch deflected your attack. Try again.',
      'User rejected': 'You hesitated at the crucial moment.'
    };

    for (const [key, message] of Object.entries(errorMap)) {
      if (error?.includes(key)) {
        return message;
      }
    }
    return error || 'An unknown error occurred';
  };

  return (
    <div className={styles.transactionStatus}>
      {status === 'signing' && (
        <>
          <div className={styles.statusIcon}>⚔️</div>
          <h3>Preparing to Slay...</h3>
          <p>Tap your card to sign the blood pact</p>
        </>
      )}

      {status === 'submitting' && (
        <>
          <div className={styles.statusIcon}>🔥</div>
          <h3>Slaying Moloch...</h3>
          <p>The demon writhes in agony</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className={styles.statusIcon}>💀</div>
          <h3>The Demon Resists!</h3>
          <p className={styles.errorMessage}>
            {getReadableError(error)}
          </p>
          <Button onClick={onClose}>Try Again</Button>
        </>
      )}
    </div>
  );
};
```

### 7. Staking Logic Helper

```typescript
// src/utils/staking.ts
export const prepareStakingData = (
  selectedChoices: Set<string>,
  existingStakes: Map<string, bigint>,
  availableAmount: bigint
) => {
  const amountPerChoice = availableAmount / BigInt(selectedChoices.size);
  const hasExistingStakes = existingStakes.size > 0;

  if (!hasExistingStakes) {
    // First time staking - use addStakes
    return {
      operation: 'addStakes',
      choiceIds: Array.from(selectedChoices).map(c => CHOICE_ID_MAPPING[c]),
      amounts: Array(selectedChoices.size).fill(amountPerChoice.toString())
    };
  } else {
    // Update existing stakes - use updateStakes
    const oldChoiceIds = Array.from(existingStakes.keys())
      .map(c => CHOICE_ID_MAPPING[c]);
    const oldAmounts = Array.from(existingStakes.values())
      .map(a => a.toString());

    const newChoiceIds = Array.from(selectedChoices)
      .map(c => CHOICE_ID_MAPPING[c]);
    const newAmounts = Array(selectedChoices.size)
      .fill(amountPerChoice.toString());

    return {
      operation: 'updateStakes',
      oldChoiceIds,
      oldAmounts,
      newChoiceIds,
      newAmounts
    };
  }
};
```

### 8. Slain Page Data Display

```typescript
// src/pages/SlainPage.tsx
const SlainPage = () => {
  const { state, actions } = useAppContext();

  const formatStakeDisplay = () => {
    const total = Array.from(state.existingStakes.values())
      .reduce((sum, amount) => sum + amount, 0n);

    return (
      <div className={styles.stakeInfo}>
        <h3>You staked {formatEther(total)} GTC on these {state.existingStakes.size} choices:</h3>
        <ul className={styles.stakeList}>
          {Array.from(state.existingStakes.entries()).map(([choiceName, amount]) => {
            const choice = CHOICES.find(c => c.id === choiceName);
            return (
              <li key={choiceName}>
                <span className={styles.choiceName}>{choice?.name}</span>
                <span className={styles.amount}>{formatEther(amount)} GTC</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const handleStartOver = () => {
    // Pre-select current choices for next round
    actions.setSelectedChoices(new Set(state.existingStakes.keys()));
    navigate('/choices');
  };

  return (
    <GameCard variant="slain">
      <div className={styles.content}>
        {formatStakeDisplay()}

        <div className={styles.actions}>
          <Button onClick={handleShareTwitter}>Share to Twitter</Button>
          <Button onClick={handleStartOver}>Start Over</Button>
        </div>
      </div>
    </GameCard>
  );
};
```

### 9. Withdraw Page Logic

```typescript
// src/pages/WithdrawPage.tsx
const WithdrawPage = () => {
  const { state } = useAppContext();
  const [destinationAddress, setDestinationAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);

    try {
      // Sign authorization
      const authorization = await signAuthorization(state);

      // Prepare withdrawal data
      let operationData;
      if (state.existingStakes.size > 0) {
        // Has stakes - unstake all and withdraw
        operationData = {
          operation: 'unstakeAllAndWithdraw',
          choiceIds: Array.from(state.existingStakes.keys()).map(c => CHOICE_ID_MAPPING[c]),
          amounts: Array.from(state.existingStakes.values()).map(a => a.toString()),
          recipient: destinationAddress
        };
      } else {
        // No stakes - just withdraw
        operationData = {
          operation: 'withdraw',
          recipient: destinationAddress
        };
      }

      // Submit to relayer
      const response = await fetch(`${RELAYER_URL}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization: {
            ...authorization,
            yParity: authorization.yParity.toString(),
            nonce: '0'
          },
          ...operationData
        })
      });

      if (response.ok) {
        // Clear state and return to start
        navigate('/');
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }

    setIsWithdrawing(false);
  };

  return (
    <GameCard variant="withdraw">
      <AddressInput
        value={destinationAddress}
        onChange={setDestinationAddress}
        placeholder="Enter destination address"
      />

      <div className={styles.actions}>
        <Button
          onClick={handleWithdraw}
          disabled={!destinationAddress || isWithdrawing}
        >
          {state.existingStakes.size > 0 ? 'Run Away with Everything' : 'Run Away'}
        </Button>

        <Button onClick={() => navigate('/choices')}>
          Go Back
        </Button>
      </div>
    </GameCard>
  );
};
```

## 🎨 CSS Updates

### Connect Button "Communing..." Animation & Error Display

```css
/* ConnectCard.module.css */
.connectButton {
  min-width: 200px; /* Fixed width prevents size changes */
  height: 56px;
  position: relative;
}

.buttonText {
  transition: opacity 0.3s ease;
  display: inline-block;
}

.buttonTextHidden {
  opacity: 0;
}

.buttonTextOverlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  font-weight: inherit;
  color: inherit;
}

/* Error message styling */
.errorMessage {
  margin-top: 16px;
  padding: 12px 16px;
  color: var(--component-text-error, #ff4444);
  border: 1px solid var(--component-border-error, #ff4444);
  border-radius: 4px;
  background: rgba(255, 68, 68, 0.1);
  font-size: 14px;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Transaction Status Styling

```css
/* ChoicesCard.module.css */
.transactionStatus {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
  min-height: 400px;
  animation: fadeIn 0.3s ease;
}

.statusIcon {
  font-size: 64px;
  margin-bottom: 24px;
  animation: pulse 1.5s ease infinite;
}

.errorMessage {
  color: var(--component-text-error);
  margin: 16px 0;
  padding: 16px;
  border: 1px solid var(--component-border-error);
  border-radius: 8px;
  background: var(--component-bg-error-subtle);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

## ⚠️ Important Considerations

### 1. Error Handling Locations
- **Connect Page**: Errors shown below the Connect button (NFC connection issues, network errors)
- **Choices Page**: Transaction status/errors replace the choice selection area temporarily
- **Test Page**: Errors are handled silently with console logs (it's a test/setup page)
- **Withdraw Page**: Errors shown inline (not detailed in this doc but follow same pattern)

### 2. Staking Operations
- **NEVER** call unstake by itself - always either:
  - `addStakes` for first-time staking
  - `updateStakes` for reallocation
  - `unstakeAllAndWithdraw` for complete exit
- **Start Over** doesn't submit transactions - just navigates with pre-selected choices

### 2. Security
- Don't store generated private keys in localStorage (use sessionStorage or memory only)
- Clear generated wallets after withdrawal completes
- Validate all addresses before submitting to relayer

### 3. Error Handling
- Always show user-friendly error messages
- Allow retry without re-signing if relayer submission fails
- Handle NFC connection failures gracefully

### 4. Testing Checklist
- [ ] Test with new NFC card (no existing stakes)
- [ ] Test with NFC card that has existing stakes
- [ ] Test generated wallet flow
- [ ] Test topping up to 100 GTC
- [ ] Test all 4 relayer operations
- [ ] Test error recovery flows
- [ ] Test navigation between pages preserves state

## 📦 File Structure

```
packages/frontend/src/
├── pages/
│   ├── TestPage.tsx         (new - entry point)
│   ├── ConnectPage.tsx      (refactored from Test.tsx)
│   ├── ChoicesPage.tsx      (refactored from Test2.tsx)
│   ├── SlainPage.tsx        (refactored from Test3.tsx)
│   └── WithdrawPage.tsx     (refactored from Test4.tsx)
├── components/
│   ├── TransactionStatus.tsx (new)
│   └── [existing components]
├── contexts/
│   └── AppContext.tsx       (new - global state)
├── utils/
│   ├── balances.ts          (new - balance checking)
│   ├── staking.ts           (new - staking logic)
│   └── [existing utils]
└── App.tsx                  (update routes)
```

## 🚀 Implementation Steps

1. **Create AppContext** for global state management
2. **Implement TestPage** with burner/generated wallet options
3. **Add balance checking utilities** (ERC20 + ERC6909)
4. **Update ConnectPage** with balance checking and routing logic
5. **Refactor ChoicesPage** with transaction handling
6. **Create TransactionStatus component** for status/error display
7. **Update SlainPage** to show actual stake data
8. **Update WithdrawPage** with conditional logic
9. **Update App.tsx routes** from `/test*` to proper paths
10. **Test all flows** thoroughly

## 🎯 Success Criteria

- Users can complete full flow with NFC or generated wallet
- All transactions are gasless via relayer
- Proper error handling and recovery
- State persists correctly between pages
- Demon-slayer theme remains intact
- No unnecessary transactions (only on explicit user action)

## 📝 Notes for Junior Developers

### Required Setup
1. **Environment Variables** - Create `.env` file in `packages/frontend/`:
   ```
   VITE_RELAYER_URL=https://eip7702-relayer.lucianhymer.workers.dev
   ```
   For local testing use: `VITE_RELAYER_URL=http://localhost:8787`

2. **Dependencies Already Installed** - These are already in package.json:
   - `viem` - For blockchain interactions and wallet generation
   - `react-router-dom` - For navigation
   - `@arx-research/libhalo` - For NFC card interactions

### Common Gotchas & Solutions

1. **BigInt JSON Serialization**
   - Problem: `JSON.stringify()` can't serialize BigInt values
   - Solution: Always convert to string before sending to relayer: `amount.toString()`

2. **Choice ID Format**
   - Problem: Choice IDs are huge numbers that must be strings
   - Solution: Keep them as strings in `CHOICE_ID_MAPPING`, only convert to BigInt when calling contracts

3. **NFC Testing Without Card**
   - Add to `.env`: `VITE_USE_DEV_WALLET=true`
   - This uses a hardcoded test wallet (see `nfcResource.ts`)
   - Remember to set back to `false` for production

4. **Generated Wallet Persistence**
   - Problem: User refreshes page and loses generated wallet
   - Solution: Consider sessionStorage (NOT localStorage) for temporary persistence
   - Clear it after withdrawal completes

5. **Race Conditions**
   - Problem: User rapidly clicks buttons causing multiple submissions
   - Solution: Always disable buttons during async operations
   - Use `loading` states consistently

### Debugging Tips

1. **Console Logging Points** - Add logs at these critical points:
   ```typescript
   console.log('Balance check:', { walletBalance, existingStakes });
   console.log('Staking data:', { operation, choiceIds, amounts });
   console.log('Relayer response:', response);
   ```

2. **Network Tab** - Monitor these endpoints:
   - `/test-mint` - Should return 200 with txHash
   - `/relay` - Check the request payload structure
   - Look for CORS errors (should be fine with current setup)

3. **Common Error Messages & Fixes**:
   - "Insufficient holdings" → User has less than 90 GTC total
   - "Invalid authorization" → NFC signing failed, retry
   - "Choice ID not approved" → Check CHOICE_ID_MAPPING matches relayer config
   - "WebAuthn error" → HaLo Bridge not connected (desktop) or NFC disabled (mobile)

### Testing Checklist by Page

**Test Page:**
- [ ] "I have a burner" → connects → tops up → navigates
- [ ] "I don't have a burner" → generates wallet → mints 100 → navigates
- [ ] Error handling for mint failures

**Connect Page:**
- [ ] Shows "Communing..." during connection
- [ ] With stakes → goes to /slain
- [ ] Without stakes → goes to /choices
- [ ] Error message appears below button
- [ ] Works with both NFC and generated wallets

**Choices Page:**
- [ ] Dynamic amount calculation correct
- [ ] Selected choices persist if navigating away and back
- [ ] Transaction status replaces choices area
- [ ] Error messages are user-friendly
- [ ] Can retry after error

**Slain Page:**
- [ ] Shows actual stake amounts (not hardcoded)
- [ ] "Start Over" pre-selects previous choices
- [ ] Class calculation matches selected stats

**Withdraw Page:**
- [ ] "Run Away" vs "Run Away with Everything" text changes
- [ ] Address validation works
- [ ] Correct operation called based on stakes

### Performance Tips

1. **Batch RPC Calls** - When checking 6 stake balances, consider using multicall
2. **Memoize Calculations** - Use `useMemo` for amount calculations
3. **Debounce Navigation** - Prevent double-navigation with a flag

### DO NOT:
- Store private keys in localStorage (memory or sessionStorage only)
- Submit transactions without explicit user action
- Modify the demon-slayer theme or existing component designs
- Create new UI components when existing ones work
- Skip error handling "to save time"

### Quick Start Order:
1. Create AppContext first
2. Test balance checking in console
3. Implement Test page
4. Update Connect page
5. Refactor Choices page with transaction handling
6. Update Slain page
7. Test full flow end-to-end
8. Add error handling polish

Remember: **It's better to ask for clarification than to make assumptions!** The existing codebase has working NFC integration, relayer communication, and UI components - your job is mainly connecting them with proper state management and flow control.

This implementation maintains the existing design while adding sophisticated state management and proper transaction handling. The demon-slayer theme is preserved throughout, and the user experience is smooth whether using NFC cards or generated wallets.
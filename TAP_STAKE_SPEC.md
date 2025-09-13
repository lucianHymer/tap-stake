# Tap-Stake - Feature Documentation

## Overview
Build a proof-of-concept application that uses NFC card wallets (via libhalo) to sign messages and transactions on Optimism, with future support for paymaster-sponsored transactions via EIP-7702.

## Project Structure

Recommended monorepo structure with two packages:

```
tap-stake/
├── packages/
│   ├── contracts/        # Foundry project
│   │   ├── src/
│   │   │   └── TapStakeImplementation.sol
│   │   ├── test/
│   │   ├── script/
│   │   └── foundry.toml
│   └── frontend/         # React project  
│       ├── src/
│       │   ├── components/
│       │   ├── lib/
│       │   └── App.tsx
│       ├── package.json
│       └── vite.config.ts
├── package.json          # Root package.json for workspace
└── README.md

```

**Benefits of monorepo approach:**
- Shared TypeScript types for contract ABIs
- Coordinated deployments and testing
- Single repository for full-stack POC
- Easy contract address management between packages

## MVP Scope (Phase 1)
Basic signature generation from NFC card interaction.

### User Flow
1. User loads web application
2. User clicks "Sign with NFC" button
3. Browser prompts for NFC interaction
4. User taps NFC card to device
5. Application displays signed message and signer address

### Technical Requirements

#### Dependencies
- **libhalo**: NFC card interaction library
- **viem**: Ethereum interaction library
- **React**: Frontend framework (or vanilla JS for simplicity)

#### Core Components

##### 1. NFC Interface Layer
```typescript
// Uses libhalo's execHaloCmdWeb for browser NFC interaction
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';

const signWithNFC = async (message: string) => {
  const command = {
    name: 'sign',
    message: message,
    keyNo: 1  // Key slot on the card
  };
  
  const result = await execHaloCmdWeb(command);
  return result.signature;
};
```

##### 2. Viem Account Creation
Based on libburner pattern - create a viem-compatible account that delegates signing to NFC:

```typescript
const createNFCAccount = (address: `0x${string}`) => {
  return {
    address,
    signMessage: async ({ message }) => {
      const messageHash = hashMessage(message);
      const signature = await signWithNFC(messageHash);
      return signature;
    },
    signTransaction: async (transaction) => {
      const serialized = serializeTransaction(transaction);
      const hash = keccak256(serialized);
      const signature = await signWithNFC(hash);
      return signature;
    }
  };
};
```

##### 3. Basic UI Component
```jsx
function NFCSignButton() {
  const [signature, setSignature] = useState(null);
  const [signerAddress, setSignerAddress] = useState(null);
  
  const handleSign = async () => {
    try {
      // Get card data first
      const cardData = await execHaloCmdWeb({ name: 'get_data' });
      const address = extractAddressFromCardData(cardData);
      
      // Create account and sign
      const account = createNFCAccount(address);
      const message = "Hello from NFC Wallet!";
      const sig = await account.signMessage({ message });
      
      setSignature(sig);
      setSignerAddress(address);
    } catch (error) {
      console.error('NFC signing failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleSign}>Sign with NFC Card</button>
      {signature && (
        <div>
          <p>Signer: {signerAddress}</p>
          <p>Signature: {signature}</p>
        </div>
      )}
    </div>
  );
}
```

### Implementation Notes

1. **Card Initialization**: Cards must be pre-programmed with ECDSA keys. The POC assumes cards are already initialized.

2. **Browser Compatibility**: Requires browser with Web NFC API support (Chrome on Android, desktop Chrome with NFC reader).

3. **Error Handling**: Implement proper error states for:
   - NFC not available
   - Card read failure
   - Invalid signature

## Phase 2: EIP-7702 Integration for Paymaster Support

### Overview
Extend the NFC wallet to support gasless transactions using EIP-7702, which allows EOAs to temporarily delegate execution to smart contracts, enabling paymaster sponsorship.

### Technical Architecture

#### 1. Enhanced Viem Account
Add `signAuthorization` method to support EIP-7702:

```typescript
const createEIP7702NFCAccount = (address: `0x${string}`) => {
  return {
    address,
    signMessage: async ({ message }) => {
      // ... existing implementation
    },
    signTransaction: async (transaction) => {
      // ... existing implementation  
    },
    signAuthorization: async (authorization) => {
      // New method for EIP-7702
      const authMessage = encodeAuthorizationMessage({
        chainId: authorization.chainId,
        nonce: authorization.nonce || 0n,
        contractAddress: authorization.contractAddress
      });
      
      const digest = keccak256(authMessage);
      const signature = await signWithNFC(digest);
      
      // Parse signature components
      const { v, r, s } = parseSignature(signature);
      
      return {
        chainId: authorization.chainId,
        nonce: authorization.nonce || 0n,
        contractAddress: authorization.contractAddress,
        r,
        s,
        yParity: v === 27 ? 0 : 1
      };
    }
  };
};
```

#### 2. Smart Account Implementation Contract
Deploy a minimal smart account implementation that the EOA can delegate to:

```solidity
contract TapStakeImplementation {
    // Supports execute for single calls
    function execute(address to, uint256 value, bytes calldata data) 
        external 
        returns (bytes memory) 
    {
        require(msg.sender == address(this), "Only self");
        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "Execution failed");
        return result;
    }
    
    // Supports batched operations
    function executeBatch(Call[] calldata calls) 
        external 
        returns (bytes[] memory results) 
    {
        require(msg.sender == address(this), "Only self");
        results = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory result) = 
                calls[i].to.call{value: calls[i].value}(calls[i].data);
            require(success, "Batch execution failed");
            results[i] = result;
        }
    }
}
```

#### 3. Transaction Flow with Paymaster

```typescript
async function sendGaslessTransaction() {
  // 1. Create NFC account
  const account = createEIP7702NFCAccount(nfcAddress);
  
  // 2. Sign authorization to delegate to smart account
  const authorization = await account.signAuthorization({
    contractAddress: IMPLEMENTATION_ADDRESS,
    chainId: optimism.id,
  });
  
  // 3. Prepare the actual transaction call
  const callData = encodeFunctionData({
    abi: implementationABI,
    functionName: 'execute',
    args: [targetAddress, value, data]
  });
  
  // 4. Create transaction with authorization list
  const tx = {
    authorizationList: [authorization],
    to: account.address, // Call self with delegated code
    data: callData,
    value: 0n,
    // Paymaster will handle gas
  };
  
  // 5. Send through paymaster service
  const hash = await paymasterClient.sendTransaction(tx);
  return hash;
}
```

### Paymaster Integration

Custom paymaster contract will be developed separately to handle gas sponsorship for EIP-7702 authorized transactions. The frontend will interact with the deployed paymaster to submit sponsored transactions.

### Security Considerations

1. **Authorization Scope**: Each authorization is single-use (nonce-protected) and only valid for one transaction.

2. **Implementation Contract**: Must be audited and minimal - only expose necessary functionality.

3. **Signature Verification**: Always verify recovered address matches expected NFC card address.

4. **Replay Protection**: EIP-7702 includes built-in replay protection via nonce.

### Migration Path

1. **Phase 1 → Phase 2**: The core NFC signing logic remains unchanged. Only need to:
   - Add `signAuthorization` method
   - Deploy implementation contract
   - Integrate paymaster service

2. **Testing Strategy**:
   - Test on Optimism Sepolia first
   - Verify authorization signing works
   - Confirm paymaster sponsorship
   - Load test with multiple cards

### Dependencies for Phase 2

- `viem` >= 2.17.0 (EIP-7702 support)
- Paymaster service account (Pimlico/Alchemy/custom)
- Deployed implementation contract on Optimism
- NFC cards (same as Phase 1)

## Development Checklist

### Phase 1 (MVP)
- [ ] Set up React app with Vite/Next.js
- [ ] Install libhalo and viem
- [ ] Implement basic NFC command execution
- [ ] Create viem account wrapper for NFC signing
- [ ] Build simple UI with sign button
- [ ] Display signature and signer address
- [ ] Add error handling for NFC failures
- [ ] Test with physical NFC card

### Phase 2 (EIP-7702)
- [ ] Extend viem account with `signAuthorization`
- [ ] Deploy implementation contract to Optimism Sepolia
- [ ] Integrate paymaster service (choose provider)
- [ ] Implement authorization + transaction flow
- [ ] Add transaction status tracking
- [ ] Test gasless transactions end-to-end
- [ ] Deploy implementation to Optimism mainnet
- [ ] Security review of implementation contract

## References

- [libhalo Documentation](https://github.com/arx-research/libhalo)
- [libburner Source (reference implementation)](https://github.com/arx-research/libburner)
- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [Viem EIP-7702 Support](https://viem.sh/docs/actions/wallet/signAuthorization)
- [Optimism Account Abstraction Docs](https://docs.optimism.io/builders/tools/build/account-abstraction)
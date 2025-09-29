import { useState } from 'react';
import {
  createWalletClient,
  createPublicClient,
  custom,
  parseEther,
  encodeFunctionData,
  type Address
} from 'viem';
import { optimismSepolia } from 'viem/chains';

// Contract ABIs
const BATCH_EXECUTOR_ABI = [
  {
    name: 'executeBatch',
    type: 'function',
    inputs: [{
      name: 'calls',
      type: 'tuple[]',
      components: [
        { name: 'target', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' }
      ]
    }],
    outputs: [{ name: 'results', type: 'bytes[]' }]
  }
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'mint',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  }
] as const;

// Deployed contract addresses (update after deployment)
const CONTRACTS = {
  batchExecutor: '0xC6325BB22cacDb2481C527131d426861Caf44A40' as Address,
  testToken: '0xbC493c76D6Fa835DA7DB2310ED1Ab5d03A0F4602' as Address,
  stake: '0xA13E9b97ade8561FFf7bfA11DE8203d81D0880C1' as Address
};

export function EIP7702Demo() {
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState<string>('');

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus('MetaMask not found');
      return null;
    }

    const walletClient = createWalletClient({
      chain: optimismSepolia,
      transport: custom(window.ethereum)
    });

    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: custom(window.ethereum)
    });

    const [address] = await walletClient.requestAddresses();
    setStatus(`Connected: ${address}`);
    return { walletClient, publicClient, address };
  };

  const executeBatchTransaction = async () => {
    try {
      setStatus('Connecting wallet...');
      const wallet = await connectWallet();
      if (!wallet) return;

      const { walletClient, publicClient, address } = wallet;

      // Prepare batch calls
      const approveAmount = parseEther('100');

      // Call 1: Approve Stake contract to spend tokens
      const approveCall = {
        target: CONTRACTS.testToken,
        value: 0n,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.stake, approveAmount]
        })
      };

      // Call 2: Stake tokens
      const stakeCall = {
        target: CONTRACTS.stake,
        value: 0n,
        data: encodeFunctionData({
          abi: [{
            name: 'stake',
            type: 'function',
            inputs: [{ name: 'amount', type: 'uint256' }],
            outputs: []
          }],
          functionName: 'stake',
          args: [approveAmount]
        })
      };

      setStatus('Signing EIP-7702 authorization...');

      // Sign authorization for BatchExecutor contract
      // @ts-ignore - signAuthorization is a new method for EIP-7702
      const authorization = await walletClient.signAuthorization({
        account: address,
        contractAddress: CONTRACTS.batchExecutor,
      });

      setStatus('Sending batch transaction...');

      // Encode batch execution
      const batchData = encodeFunctionData({
        abi: BATCH_EXECUTOR_ABI,
        functionName: 'executeBatch',
        args: [[approveCall, stakeCall]]
      });

      // Send EIP-7702 transaction
      const hash = await walletClient.sendTransaction({
        account: address,
        to: address, // Call to self (delegated)
        data: batchData,
        // @ts-ignore - authorizationList is a new field for EIP-7702
        authorizationList: [authorization],
        chain: optimismSepolia
      });

      setTxHash(hash);
      setStatus(`Transaction sent! Hash: ${hash}`);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Transaction confirmed! Block: ${receipt.blockNumber}`);

    } catch (error: any) {
      console.error('Transaction failed:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const mintTestTokens = async () => {
    try {
      setStatus('Connecting wallet...');
      const wallet = await connectWallet();
      if (!wallet) return;

      const { walletClient, publicClient, address } = wallet;

      setStatus('Minting test tokens...');
      const hash = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.testToken,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [address, parseEther('1000')]
      });

      setStatus(`Mint transaction sent: ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Tokens minted! Block: ${receipt.blockNumber}`);
    } catch (error: any) {
      console.error('Mint failed:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const checkBalance = async () => {
    try {
      setStatus('Checking balance...');
      const wallet = await connectWallet();
      if (!wallet) return;

      const { publicClient, address } = wallet;

      const balance = await publicClient.readContract({
        address: CONTRACTS.testToken,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address]
      });

      const balanceInEther = Number(balance) / 1e18;
      setStatus(`Balance: ${balanceInEther.toFixed(4)} TEST`);
    } catch (error: any) {
      console.error('Balance check failed:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="eip7702-demo" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#ff0000', textShadow: '0 0 10px #ff0000' }}>
        EIP-7702 BATCH TRANSACTION DEMO
      </h1>

      <div style={{
        background: 'rgba(0,0,0,0.8)',
        border: '2px solid #ff0000',
        borderRadius: '5px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#ff6666' }}>What This Does:</h2>
        <ol style={{ color: '#ccc', lineHeight: '1.8' }}>
          <li>Signs an EIP-7702 authorization to delegate your EOA to BatchExecutor</li>
          <li>Approves Stake contract to spend 100 TEST tokens</li>
          <li>Stakes 100 TEST tokens</li>
          <li>All in a single transaction!</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={executeBatchTransaction}
          style={{
            background: 'linear-gradient(45deg, #ff0000, #660000)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '18px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          Execute Batch (Approve + Stake)
        </button>
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid #666',
        borderRadius: '5px',
        padding: '15px',
        marginBottom: '20px',
        color: '#00ff00',
        fontFamily: 'monospace'
      }}>
        <p>Status: {status}</p>
        {txHash && (
          <p>
            View on Explorer:{' '}
            <a
              href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00ffff' }}
            >
              {txHash.slice(0, 10)}...
            </a>
          </p>
        )}
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.8)',
        border: '1px solid #333',
        borderRadius: '5px',
        padding: '15px'
      }}>
        <h3 style={{ color: '#ff9999' }}>Setup Actions:</h3>
        <button
          onClick={mintTestTokens}
          style={{
            background: '#333',
            color: 'white',
            border: '1px solid #666',
            padding: '10px 20px',
            marginRight: '10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Mint Test Tokens
        </button>
        <button
          onClick={checkBalance}
          style={{
            background: '#333',
            color: 'white',
            border: '1px solid #666',
            padding: '10px 20px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Check Balance
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '10px',
        background: 'rgba(255,255,0,0.1)',
        border: '1px solid #ffff00',
        borderRadius: '5px',
        color: '#ffff00'
      }}>
        <p><strong>⚠️ Note:</strong> Update contract addresses after deployment!</p>
      </div>
    </div>
  );
}
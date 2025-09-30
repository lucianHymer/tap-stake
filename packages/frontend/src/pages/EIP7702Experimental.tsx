import { useState } from "react";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  encodeFunctionData,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimismSepolia } from "viem/chains";
// EIP-7702 support is now in main viem, not experimental

// Contract ABIs
const BATCH_EXECUTOR_ABI = [
  {
    name: "executeBatch",
    type: "function",
    inputs: [
      {
        name: "calls",
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
] as const;

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "mint",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

// Deployed contract addresses (Updated: Sep 30, 2025)
const CONTRACTS = {
  testToken: "0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649" as Address,
  batchExecutor: "0x7Edd1EBd251eE6D943Ae64A20969Cf40a1aa236C" as Address, // SelfBatchExecutor
  stake: "0x334559433296D9Dd9a861c200aFB1FEAF77388AA" as Address,
  stakerWallet: "0xB9f60eb68B55396CEb1a0a347aEfA48AE6473F33" as Address, // NEW: Gasless staking
};

export function EIP7702Experimental() {
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  const executeBatchWithPrivateKey = async () => {
    try {
      if (!privateKey) {
        setStatus("Please enter a private key first");
        return;
      }

      setStatus("Signing EIP-7702 authorization...");

      const account = privateKeyToAccount(privateKey as `0x${string}`);

      // Create wallet client with the private key account
      const walletClient = createWalletClient({
        account,
        chain: optimismSepolia,
        transport: http(),
      });

      setStatus("Signing EIP-7702 authorization...");

      // Sign authorization for BatchExecutor contract
      const authorization = await walletClient.signAuthorization({
        account,
        contractAddress: CONTRACTS.batchExecutor,
        executor: "self",
      });

      // Prepare batch calls
      const approveAmount = parseEther("100");

      const approveCall = {
        target: CONTRACTS.testToken,
        value: 0n,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACTS.stake, approveAmount],
        }),
      };

      const stakeCall = {
        target: CONTRACTS.stake,
        value: 0n,
        data: encodeFunctionData({
          abi: [
            {
              name: "stake",
              type: "function",
              inputs: [{ name: "amount", type: "uint256" }],
              outputs: [],
            },
          ],
          functionName: "stake",
          args: [approveAmount],
        }),
      };

      setStatus("Sending batch transaction...");

      // Encode batch execution
      const batchData = encodeFunctionData({
        abi: BATCH_EXECUTOR_ABI,
        functionName: "executeBatch",
        args: [[approveCall, stakeCall]],
      });

      // Send EIP-7702 transaction
      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: batchData,
        authorizationList: [authorization],
      });

      setTxHash(hash);
      setStatus(`Transaction sent! Hash: ${hash}`);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Transaction confirmed! Block: ${receipt.blockNumber}`);
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const mintTestTokens = async () => {
    try {
      if (!privateKey) {
        setStatus("Please enter a private key first");
        return;
      }

      setStatus("Minting test tokens...");

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: optimismSepolia,
        transport: http(),
      });

      const hash = await walletClient.writeContract({
        address: CONTRACTS.testToken,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [account.address, parseEther("1000")],
      });

      setStatus(`Mint transaction sent: ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Tokens minted! Block: ${receipt.blockNumber}`);
    } catch (error: any) {
      console.error("Mint failed:", error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const checkBalance = async () => {
    try {
      if (!privateKey) {
        setStatus("Please enter a private key first");
        return;
      }

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      setStatus("Checking balance...");

      const balance = await publicClient.readContract({
        address: CONTRACTS.testToken,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      });

      const balanceInEther = Number(balance) / 1e18;
      setStatus(`Balance: ${balanceInEther.toFixed(4)} TEST`);
    } catch (error: any) {
      console.error("Balance check failed:", error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div
      className="eip7702-demo"
      style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}
    >
      <h1 style={{ color: "#ff0000", textShadow: "0 0 10px #ff0000" }}>
        EIP-7702 EXPERIMENTAL DEMO
      </h1>

      <div
        style={{
          background: "rgba(0,0,0,0.8)",
          border: "2px solid #ff0000",
          borderRadius: "5px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ color: "#ff6666" }}>What This Does:</h2>
        <ol style={{ color: "#ccc", lineHeight: "1.8" }}>
          <li>
            Signs an EIP-7702 authorization to delegate your EOA to
            BatchExecutor
          </li>
          <li>Approves Stake contract to spend 100 TEST tokens</li>
          <li>Stakes 100 TEST tokens</li>
          <li>All in a single transaction!</li>
        </ol>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Enter private key (0x...)"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(0,0,0,0.8)",
              border: "1px solid #666",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "14px",
              borderRadius: "3px",
            }}
          />
        </div>
        {privateKey && (
          <p
            style={{ color: "#00ff00", marginBottom: "10px", fontSize: "14px" }}
          >
            Address:{" "}
            {privateKey
              ? privateKeyToAccount(privateKey as `0x${string}`).address
              : ""}
          </p>
        )}
        <button
          onClick={executeBatchWithPrivateKey}
          style={{
            background: "linear-gradient(45deg, #ff0000, #660000)",
            color: "white",
            border: "none",
            padding: "15px 30px",
            fontSize: "18px",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          Execute Batch Transaction
        </button>
      </div>

      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid #666",
          borderRadius: "5px",
          padding: "15px",
          marginBottom: "20px",
          color: "#00ff00",
          fontFamily: "monospace",
        }}
      >
        <p>Status: {status}</p>
        {txHash && (
          <p>
            View on Explorer:{" "}
            <a
              href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#00ffff" }}
            >
              {txHash.slice(0, 10)}...
            </a>
          </p>
        )}
      </div>

      <div
        style={{
          background: "rgba(0,0,0,0.8)",
          border: "1px solid #333",
          borderRadius: "5px",
          padding: "15px",
        }}
      >
        <h3 style={{ color: "#ff9999" }}>Setup Actions:</h3>
        <button
          onClick={mintTestTokens}
          style={{
            background: "#333",
            color: "white",
            border: "1px solid #666",
            padding: "10px 20px",
            marginRight: "10px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          Mint Test Tokens
        </button>
        <button
          onClick={checkBalance}
          style={{
            background: "#333",
            color: "white",
            border: "1px solid #666",
            padding: "10px 20px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          Check Balance
        </button>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "rgba(255,255,0,0.1)",
          border: "1px solid #ffff00",
          borderRadius: "5px",
          color: "#ffff00",
        }}
      >
        <p>
          <strong>⚠️ Important:</strong> This demo uses experimental EIP-7702
          features.
        </p>
        <p>
          For the batch transaction, you'll need to provide a private key (demo
          only!).
        </p>
        <p>MetaMask doesn't yet support signAuthorization natively.</p>
      </div>
    </div>
  );
}

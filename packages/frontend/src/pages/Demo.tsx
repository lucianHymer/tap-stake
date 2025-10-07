import { useState } from "react";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  type Address,
  type Hex,
} from "viem";
import { optimismSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// DEMO KEYS - NOT FOR PRODUCTION
// Signer (user) private key - this is who will delegate to StakerWallet
const DEMO_PRIVATE_KEY = "0x3fbfa3f3d782abc0871054d84cd48c96837df9e401cabe652d9d90b66fcadc64" as Hex;
const DEMO_ADDRESS = "0x39F04C8046D2C43F8024eb2626A79E840fD4676B" as Address;

// Contract ABIs
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

// Deployed contract addresses
const CONTRACTS = {
  testToken: "0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649" as Address,
  stake: "0x334559433296D9Dd9a861c200aFB1FEAF77388AA" as Address,
  stakerWallet: "0x39fe042d517031a812aBf6f2e15a2615A6c08f3f" as Address,
};

// Relayer URL - force local for demo
const RELAYER_URL = "http://localhost:8787";

export function Demo() {
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);

  // Create account from hardcoded private key
  const account = privateKeyToAccount(DEMO_PRIVATE_KEY);

  const walletClient = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  const executeGaslessStake = async () => {
    try {
      setIsExecuting(true);
      setErrorDetails("");
      setStatus("🔧 DEMO MODE: Signing EIP-7702 authorization...");

      // Get current transaction nonce
      console.log('🎮 Demo: Getting tx nonce for account:', DEMO_ADDRESS);
      const txNonce = await publicClient.getTransactionCount({
        address: DEMO_ADDRESS,
      });
      console.log('🎮 Demo: Current tx nonce:', txNonce);

      // Prepare stake amount
      const stakeAmount = parseEther("100");

      setErrorDetails(`DEMO AUTHORIZATION:\n- Signer: ${DEMO_ADDRESS}\n- Contract: ${CONTRACTS.stakerWallet}\n- Amount: 100 TEST\n- Chain: ${optimismSepolia.id}\n- Nonce: ${txNonce}`);

      // Sign authorization for StakerWallet contract
      console.log('🎮 Demo: Signing authorization...');
      // @ts-ignore - TypeScript doesn't know about signAuthorization yet
      const authorization = await walletClient.signAuthorization({
        contractAddress: CONTRACTS.stakerWallet,
        chainId: optimismSepolia.id,
        nonce: txNonce,
      });
      console.log('🎮 Demo: Authorization signed:', authorization);

      setStatus("✅ SIGNED! Sending to relayer...");
      setErrorDetails(`Authorization complete! Sending to relayer at ${RELAYER_URL}`);

      // Send to relayer
      console.log('🎮 Demo: Sending to relayer...');
      const relayPayload = {
        authorization: {
          contractAddress: authorization.address, // viem returns 'address' not 'contractAddress'
          chainId: authorization.chainId,
          nonce: authorization.nonce.toString(),
          r: authorization.r,
          s: authorization.s,
          yParity: authorization.yParity,
        },
        amount: stakeAmount.toString(),
      };

      console.log('🎮 Demo: Request payload:', relayPayload);

      const response = await fetch(RELAYER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relayPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('🎮 Demo: Relay failed:', result);
        throw new Error(result.error || 'Relay failed');
      }

      console.log('🎮 Demo: Transaction relayed! Hash:', result.txHash);
      setTxHash(result.txHash);
      setStatus(`🎉 Transaction relayed! Hash: ${result.txHash}`);
      setErrorDetails(`✨ GASLESS SUCCESS ✨\nHash: ${result.txHash}\n\nThe relayer paid the gas!`);

      // Wait for confirmation
      console.log('🎮 Demo: Waiting for confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result.txHash,
        timeout: 60_000, // 60 second timeout
      });
      console.log('🎮 Demo: Transaction confirmed!', receipt);
      setStatus(`✅ CONFIRMED! Block: ${receipt.blockNumber}`);
      setErrorDetails(`Success!\nBlock: ${receipt.blockNumber}\nGas Used: ${receipt.gasUsed}\n\n✨ GASLESS VICTORY ✨`);

    } catch (error: any) {
      console.error('🎮 Demo: Transaction failed:', error);
      setStatus(`❌ Failed: ${error.message}`);

      let detailedError = error.message || 'Unknown error';

      if (error.message.includes('fetch')) {
        detailedError = `Relayer unreachable at ${RELAYER_URL}. Run: cd packages/relayer && wrangler dev`;
      }

      setErrorDetails(detailedError);
    } finally {
      setIsExecuting(false);
    }
  };

  const mintTestTokens = async () => {
    try {
      setStatus("Minting test tokens...");
      setErrorDetails("");

      // Mint tokens directly (requires gas)
      const hash = await walletClient.writeContract({
        address: CONTRACTS.testToken,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [DEMO_ADDRESS, parseEther("1000")],
      });

      setStatus(`Minting... ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`✅ Minted 1000 TEST tokens! Block: ${receipt.blockNumber}`);

    } catch (error: any) {
      console.error('Mint failed:', error);
      setStatus(`❌ Mint failed`);
      setErrorDetails(error.message);
    }
  };

  const checkBalance = async () => {
    try {
      setStatus("Checking balances...");
      setErrorDetails("");

      const ethBalance = await publicClient.getBalance({
        address: DEMO_ADDRESS,
      });

      const tokenBalance = await publicClient.readContract({
        address: CONTRACTS.testToken,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [DEMO_ADDRESS],
      });

      const ethInEther = Number(ethBalance) / 1e18;
      const tokenInEther = Number(tokenBalance as bigint) / 1e18;

      setStatus(`💰 ETH: ${ethInEther.toFixed(6)} | TEST: ${tokenInEther.toFixed(2)}`);
      setErrorDetails(`Demo Account: ${DEMO_ADDRESS}\nETH: ${ethInEther} (for minting only)\nTEST: ${tokenInEther}`);

    } catch (error: any) {
      setStatus(`❌ Check failed`);
      setErrorDetails(error.message);
    }
  };

  return (
    <div
      id="demo-container"
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        background: "black",
        minHeight: "100vh",
        fontFamily: "monospace",
      }}
    >
      <h1
        style={{
          color: "#00ff00",
          textShadow: "0 0 10px #00ff00",
          fontSize: "32px",
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        🧪 DEMO MODE: HARDCODED KEYS 🧪
      </h1>

      <div
        style={{
          background: "rgba(0,255,0,0.1)",
          border: "2px solid #00ff00",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ color: "#00ff00", marginBottom: "10px" }}>
          Demo Configuration:
        </h2>
        <div style={{ color: "#00ff00", fontSize: "14px" }}>
          <div>📍 Network: Optimism Sepolia</div>
          <div>🔑 Demo Address: {DEMO_ADDRESS}</div>
          <div>📡 Relayer: {RELAYER_URL}</div>
          <div>📜 StakerWallet: {CONTRACTS.stakerWallet.slice(0, 10)}...</div>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          id="execute-gasless-btn"
          onClick={executeGaslessStake}
          disabled={isExecuting}
          style={{
            background: isExecuting
              ? "linear-gradient(45deg, #444, #666)"
              : "linear-gradient(45deg, #00aa00, #00ff00)",
            color: "black",
            border: "none",
            padding: "20px 40px",
            fontSize: "20px",
            borderRadius: "10px",
            cursor: isExecuting ? "wait" : "pointer",
            fontWeight: "bold",
            width: "100%",
            marginBottom: "10px",
            boxShadow: "0 0 20px rgba(0,255,0,0.5)",
          }}
        >
          {isExecuting ? "⏳ EXECUTING..." : "🚀 EXECUTE GASLESS STAKE"}
        </button>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={mintTestTokens}
            style={{
              background: "#444",
              color: "white",
              border: "1px solid #666",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Mint Test Tokens
          </button>
          <button
            onClick={checkBalance}
            style={{
              background: "#444",
              color: "white",
              border: "1px solid #666",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Check Balances
          </button>
        </div>
      </div>

      <div
        id="status-display"
        style={{
          background: "rgba(0,0,0,0.8)",
          border: "1px solid #00ff00",
          borderRadius: "5px",
          padding: "15px",
          marginBottom: "20px",
          color: "#00ff00",
          minHeight: "60px",
        }}
      >
        <strong>STATUS:</strong> {status || "Ready"}
        {txHash && (
          <div style={{ marginTop: "10px" }}>
            <a
              href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#00ffff" }}
            >
              View on Etherscan →
            </a>
          </div>
        )}
      </div>

      {errorDetails && (
        <div
          id="error-details"
          style={{
            background: "rgba(0,100,0,0.2)",
            border: "1px solid #00ff00",
            borderRadius: "5px",
            padding: "15px",
            color: "#00ff00",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          <strong>DETAILS:</strong>
          <pre style={{ margin: "10px 0 0 0" }}>{errorDetails}</pre>
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          background: "rgba(255,255,0,0.1)",
          border: "1px solid #ffff00",
          borderRadius: "5px",
          color: "#ffff00",
        }}
      >
        <strong>⚠️ DEMO NOTICE:</strong>
        <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
          <li>Using hardcoded private keys for testing</li>
          <li>Run relayer locally: cd packages/relayer && wrangler dev</li>
          <li>Automated with Playwright for testing</li>
          <li>Real transactions on Optimism Sepolia</li>
        </ul>
      </div>
    </div>
  );
}
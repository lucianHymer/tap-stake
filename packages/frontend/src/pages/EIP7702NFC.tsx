import { useState } from "react";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  encodeFunctionData,
  type Address,
} from "viem";
import { optimismSepolia } from "viem/chains";
import { getCardData, createNFCAccount } from "../lib/nfc";

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

// Deployed contract addresses
const CONTRACTS = {
  testToken: "0xC6325BB22cacDb2481C527131d426861Caf44A40" as Address,
  batchExecutor: "0xbC493c76D6Fa835DA7DB2310ED1Ab5d03A0F4602" as Address,
  stake: "0xA13E9b97ade8561FFf7bfA11DE8203d81D0880C1" as Address,
};

export function EIP7702NFC() {
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [nfcAccount, setNfcAccount] = useState<any>(null);
  const [cardAddress, setCardAddress] = useState<Address | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>("");

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  const connectNFCCard = async () => {
    try {
      setStatus("🔴 TAP YOUR NFC CARD TO CONNECT...");
      setErrorDetails("");
      const cardData = await getCardData();
      const account = createNFCAccount(cardData.address);
      setNfcAccount(account);
      setCardAddress(cardData.address);
      setStatus(`✅ Connected to NFC Card: ${cardData.address.slice(0, 10)}...`);
    } catch (error: any) {
      console.error("Failed to connect NFC card:", error);
      setStatus(`❌ Connection Failed`);
      setErrorDetails(`${error.message}\n\nStack: ${error.stack?.split('\n').slice(0, 3).join('\n')}`);
    }
  };

  const executeBatchWithNFC = async () => {
    try {
      if (!nfcAccount) {
        setStatus("Please connect your NFC card first!");
        return;
      }

      setErrorDetails("");

      // Create wallet client with NFC account
      const walletClient = createWalletClient({
        account: nfcAccount,
        chain: optimismSepolia,
        transport: http(),
      });

      setStatus("🔴 TAP CARD TO SIGN EIP-7702 AUTHORIZATION...");

      // Get current nonce for the account
      const nonce = await publicClient.getTransactionCount({
        address: cardAddress!,
      });

      setErrorDetails(`Signing authorization:\n- Contract: ${CONTRACTS.batchExecutor}\n- Chain: ${optimismSepolia.id}\n- Nonce: ${nonce}`);

      // Sign authorization for BatchExecutor contract
      // Call signAuthorization directly on the NFC account
      const authorization = await nfcAccount.signAuthorization({
        contractAddress: CONTRACTS.batchExecutor,
        chainId: optimismSepolia.id,
        nonce: BigInt(nonce),
      });

      setStatus("✅ Authorization signed! Preparing transaction...");
      setErrorDetails(`Authorization signed:\n- r: ${authorization.r}\n- s: ${authorization.s}\n- yParity: ${authorization.yParity}`);

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

      // Encode batch execution
      const batchData = encodeFunctionData({
        abi: BATCH_EXECUTOR_ABI,
        functionName: "executeBatch",
        args: [[approveCall, stakeCall]],
      });

      setStatus("🔴 TAP CARD TO SIGN TRANSACTION...");

      // Send EIP-7702 transaction
      // @ts-ignore - TypeScript doesn't know about authorizationList yet
      const hash = await walletClient.sendTransaction({
        to: cardAddress!,
        data: batchData,
        authorizationList: [authorization],
      });

      setTxHash(hash);
      setStatus(`🎉 Transaction sent! Hash: ${hash}`);
      setErrorDetails(`Transaction sent:\nHash: ${hash}\nWaiting for confirmation...`);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`✅ MOLOCH SLAIN! Block: ${receipt.blockNumber}`);
      setErrorDetails(`Success!\nBlock: ${receipt.blockNumber}\nGas Used: ${receipt.gasUsed}`);
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setStatus(`❌ EIP-7702 Failed`);

      let detailedError = error.message || 'Unknown error';
      if (error.cause) {
        detailedError += `\n\nCause: ${JSON.stringify(error.cause, null, 2)}`;
      }
      if (error.details) {
        detailedError += `\n\nDetails: ${error.details}`;
      }
      if (error.shortMessage) {
        detailedError += `\n\nShort: ${error.shortMessage}`;
      }

      setErrorDetails(detailedError);
    }
  };

  const mintTestTokens = async () => {
    try {
      if (!nfcAccount) {
        setStatus("Please connect your NFC card first!");
        return;
      }

      setErrorDetails("");

      const walletClient = createWalletClient({
        account: nfcAccount,
        chain: optimismSepolia,
        transport: http(),
      });

      setStatus("Preparing mint transaction...");

      // Log the transaction parameters
      const mintAmount = parseEther("1000");
      console.log("Mint Transaction Parameters:", {
        from: cardAddress,
        to: CONTRACTS.testToken,
        functionName: "mint",
        args: {
          to: cardAddress,
          amount: mintAmount.toString()
        },
        abi: "ERC20_ABI",
        chain: "optimismSepolia"
      });

      // First, try to simulate the transaction to check if it will succeed
      try {
        console.log("Simulating mint transaction...");
        const { request } = await publicClient.simulateContract({
          account: cardAddress!,
          address: CONTRACTS.testToken,
          abi: ERC20_ABI,
          functionName: "mint",
          args: [cardAddress!, mintAmount],
        });
        console.log("Simulation successful, request:", request);
        setErrorDetails(`Simulation successful!\n- From: ${cardAddress}\n- To: ${cardAddress}\n- Amount: ${mintAmount.toString()} wei (1000 TEST)\n- Contract: ${CONTRACTS.testToken}`);
      } catch (simError: any) {
        console.error("Simulation failed:", simError);
        setErrorDetails(`Simulation failed!\nError: ${simError.message}\n\nThis might mean:\n1. Contract doesn't have public mint function\n2. Insufficient gas\n3. Contract paused or restricted`);
        // Continue anyway to get the actual error
      }

      setStatus("🔴 TAP CARD TO SIGN MINT TRANSACTION...");

      console.log("Calling writeContract with:", {
        account: nfcAccount.address,
        address: CONTRACTS.testToken,
        functionName: "mint",
        args: [cardAddress!, mintAmount]
      });

      let hash;
      try {
        hash = await walletClient.writeContract({
          account: nfcAccount,
          address: CONTRACTS.testToken,
          abi: ERC20_ABI,
          functionName: "mint",
          args: [cardAddress!, mintAmount],
        });
      } catch (writeError: any) {
        console.error("writeContract failed:", writeError);

        // Extract transaction request details if available
        let txDetails = "Transaction Request Details:\n";
        if (writeError.request) {
          txDetails += `From: ${writeError.request.from}\n`;
          txDetails += `To: ${writeError.request.to}\n`;
          txDetails += `Data: ${writeError.request.data}\n`;
        }

        setErrorDetails(`${txDetails}\nError: ${writeError.message}\n\nFull error: ${JSON.stringify(writeError, null, 2)}`);
        throw writeError;
      }

      setStatus(`Mint transaction sent: ${hash}`);
      setErrorDetails(`Transaction sent:\nHash: ${hash}\nWaiting for confirmation...`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`✅ Tokens minted! Block: ${receipt.blockNumber}`);
      setErrorDetails(`Success!\nBlock: ${receipt.blockNumber}\nGas Used: ${receipt.gasUsed}`);
    } catch (error: any) {
      console.error("Mint failed - Full error:", error);
      setStatus(`❌ Mint Failed`);

      // Extract detailed error information
      let detailedError = error.message || 'Unknown error';

      // Check for viem specific error properties
      if (error.cause) {
        detailedError += `\n\nCause: ${JSON.stringify(error.cause, null, 2)}`;
      }
      if (error.details) {
        detailedError += `\n\nDetails: ${error.details}`;
      }
      if (error.shortMessage) {
        detailedError += `\n\nShort: ${error.shortMessage}`;
      }
      if (error.metaMessages) {
        detailedError += `\n\nMeta: ${error.metaMessages.join(' | ')}`;
      }

      // Add request details if available
      if (error.request) {
        detailedError += `\n\nRequest Args:\nFrom: ${error.request.from || 'N/A'}\nTo: ${error.request.to || 'N/A'}\nData: ${error.request.data || 'N/A'}`;
      }

      setErrorDetails(detailedError);
    }
  };

  const checkBalance = async () => {
    try {
      if (!cardAddress) {
        setStatus("Please connect your NFC card first!");
        return;
      }

      setStatus("Checking balances...");
      setErrorDetails("");

      // Check ETH balance for gas
      const ethBalance = await publicClient.getBalance({
        address: cardAddress,
      });
      const ethInEther = Number(ethBalance) / 1e18;

      // Check token balance
      const tokenBalance = await publicClient.readContract({
        address: CONTRACTS.testToken,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [cardAddress],
      });
      const tokenInEther = Number(tokenBalance as bigint) / 1e18;

      setStatus(`💰 ETH: ${ethInEther.toFixed(6)} | TEST: ${tokenInEther.toFixed(4)}`);
      setErrorDetails(`Address: ${cardAddress}\nETH Balance: ${ethBalance.toString()} wei (${ethInEther} ETH)\nTEST Balance: ${(tokenBalance as bigint).toString()} wei (${tokenInEther} TEST)`);
    } catch (error: any) {
      console.error("Balance check failed:", error);
      setStatus(`❌ Balance check failed`);
      setErrorDetails(error.message);
    }
  };

  return (
    <div
      className="eip7702-nfc-demo"
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        background: "black",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          color: "#ff0000",
          textShadow: "0 0 20px #ff0000",
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "48px",
          textAlign: "center",
        }}
      >
        ⚔️ EIP-7702 NFC DEMON SLAYING ⚔️
      </h1>

      <div
        style={{
          background: "rgba(139,0,0,0.2)",
          border: "2px solid #8B0000",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 0 30px rgba(139,0,0,0.5)",
        }}
      >
        <h2 style={{ color: "#ff6666", marginBottom: "15px" }}>
          🩸 BLOOD RITUAL STEPS:
        </h2>
        <ol style={{ color: "#ff9999", lineHeight: "2", fontSize: "18px" }}>
          <li>Connect your NFC Slayer's Seal (card)</li>
          <li>Sign the EIP-7702 authorization with your blood</li>
          <li>Execute approve + stake in ONE STRIKE</li>
          <li>Moloch falls, coordination rises!</li>
        </ol>
      </div>

      {!cardAddress ? (
        <button
          onClick={connectNFCCard}
          style={{
            background: "linear-gradient(45deg, #8B0000, #ff0000)",
            color: "white",
            border: "none",
            padding: "20px 40px",
            fontSize: "24px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            textTransform: "uppercase",
            width: "100%",
            marginBottom: "20px",
            animation: "pulse 2s infinite",
            boxShadow: "0 0 40px rgba(255,0,0,0.7)",
          }}
        >
          🩸 CONNECT NFC SLAYER'S SEAL 🩸
        </button>
      ) : (
        <div>
          <div
            style={{
              background: "rgba(0,255,0,0.1)",
              border: "1px solid #00ff00",
              borderRadius: "5px",
              padding: "15px",
              marginBottom: "20px",
              color: "#00ff00",
              fontFamily: "monospace",
            }}
          >
            <strong>SLAYER'S SIGIL:</strong> {cardAddress}
          </div>

          <button
            onClick={executeBatchWithNFC}
            style={{
              background: "linear-gradient(45deg, #660000, #ff0000)",
              color: "white",
              border: "none",
              padding: "20px 40px",
              fontSize: "22px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
              marginBottom: "20px",
              boxShadow: "0 0 30px rgba(255,0,0,0.5)",
            }}
          >
            ⚔️ SLAY MOLOCH WITH EIP-7702 ⚔️
          </button>
        </div>
      )}

      <div
        style={{
          background: "rgba(0,0,0,0.8)",
          border: "1px solid #666",
          borderRadius: "5px",
          padding: "15px",
          marginBottom: "20px",
          color: "#00ff00",
          fontFamily: "monospace",
          minHeight: "60px",
        }}
      >
        <strong>BLOOD SEAL STATUS:</strong> {status}
        {txHash && (
          <div style={{ marginTop: "10px" }}>
            <strong>VICTORY RECORD:</strong>{" "}
            <a
              href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#00ffff" }}
            >
              {txHash.slice(0, 10)}...
            </a>
          </div>
        )}
      </div>

      {errorDetails && (
        <div
          style={{
            background: "rgba(139,0,0,0.3)",
            border: "1px solid #ff0000",
            borderRadius: "5px",
            padding: "15px",
            marginBottom: "20px",
            color: "#ff9999",
            fontFamily: "monospace",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <strong>📜 DEBUG SCROLL:</strong>
          <pre style={{ margin: "10px 0 0 0" }}>{errorDetails}</pre>
        </div>
      )}

      {cardAddress && (
        <div
          style={{
            background: "rgba(0,0,0,0.9)",
            border: "1px solid #333",
            borderRadius: "5px",
            padding: "15px",
            marginTop: "20px",
          }}
        >
          <h3 style={{ color: "#ff9999", marginBottom: "15px" }}>
            🔮 ARCANE PREPARATIONS:
          </h3>
          <button
            onClick={mintTestTokens}
            style={{
              background: "#333",
              color: "white",
              border: "1px solid #666",
              padding: "10px 20px",
              marginRight: "10px",
              borderRadius: "5px",
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
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Check ETH + Token Balance
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          background: "rgba(139,0,0,0.1)",
          border: "1px solid #8B0000",
          borderRadius: "5px",
          color: "#ff6666",
        }}
      >
        <p style={{ marginBottom: "10px" }}>
          <strong>⚠️ DEMON SLAYER'S WARNING:</strong>
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>🩸 This uses experimental EIP-7702 blood magic</li>
          <li>🗡️ You will tap your NFC seal TWICE per ritual</li>
          <li>💀 Works on Optimism Sepolia (testnet only)</li>
          <li>🔥 The card holds your private key - guard it well!</li>
        </ul>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
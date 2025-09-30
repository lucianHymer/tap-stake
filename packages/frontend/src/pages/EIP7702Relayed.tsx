import { useState } from "react";
import {
  createPublicClient,
  http,
  parseEther,
  type Address,
} from "viem";
import { optimismSepolia } from "viem/chains";
import { getCardData, createNFCAccount } from "../lib/nfc";

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

// Deployed contract addresses (Updated: Sep 30, 2025)
const CONTRACTS = {
  testToken: "0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649" as Address,
  stake: "0x334559433296D9Dd9a861c200aFB1FEAF77388AA" as Address,
  stakerWallet: "0xB9f60eb68B55396CEb1a0a347aEfA48AE6473F33" as Address, // Gasless staking via EIP-7702
};

// Relayer URL from environment or default
const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || "http://localhost:8787";

export function EIP7702Relayed() {
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
    console.log('🎮 EIP7702Relayed: Starting NFC card connection...');
    try {
      setStatus("🔴 TAP YOUR NFC CARD TO CONNECT...");
      setErrorDetails("");
      console.log('🎮 EIP7702Relayed: Waiting for card tap...');
      const cardData = await getCardData();
      console.log('🎮 EIP7702Relayed: Card data received:', cardData.address);

      const account = createNFCAccount(cardData.address);
      setNfcAccount(account);
      setCardAddress(cardData.address);

      console.log('🎮 EIP7702Relayed: NFC account created successfully');
      setStatus(`✅ Connected to NFC Card: ${cardData.address.slice(0, 10)}...`);
    } catch (error: any) {
      console.error('🎮 EIP7702Relayed: Failed to connect NFC card:', error);
      setStatus(`❌ Connection Failed`);
      setErrorDetails(`${error.message}\n\nStack: ${error.stack?.split('\n').slice(0, 3).join('\n')}`);
    }
  };

  const executeRelayedStake = async () => {
    try {
      if (!nfcAccount) {
        setStatus("Please connect your NFC card first!");
        return;
      }

      setErrorDetails("");
      setStatus("🔴 ONE TAP: SIGN EIP-7702 AUTHORIZATION...");

      // Get current transaction nonce for the EIP-7702 authorization
      console.log('🎮 EIP7702Relayed: Getting tx nonce for account:', cardAddress);
      const txNonce = await publicClient.getTransactionCount({
        address: cardAddress!,
      });
      console.log('🎮 EIP7702Relayed: Current tx nonce:', txNonce);

      // Prepare stake amount
      const stakeAmount = parseEther("100");

      setErrorDetails(`ONE-TAP AUTHORIZATION:\n- Contract: ${CONTRACTS.stakerWallet}\n- Amount: 100 TEST\n- Chain: ${optimismSepolia.id}\n- Nonce: ${txNonce}`);

      // Sign authorization for StakerWallet contract (SINGLE TAP!)
      console.log('🎮 EIP7702Relayed: Requesting authorization signature...');
      console.log('🎮 EIP7702Relayed: Using account:', nfcAccount);
      console.log('🎮 EIP7702Relayed: Delegating to contract:', CONTRACTS.stakerWallet);

      // @ts-ignore - TypeScript doesn't know about signAuthorization yet
      const authorization = await nfcAccount.signAuthorization({
        contractAddress: CONTRACTS.stakerWallet,
        chainId: optimismSepolia.id,
        nonce: BigInt(txNonce),
      });
      console.log('🎮 EIP7702Relayed: Authorization signed successfully:', authorization);

      setStatus("✅ SIGNED! Sending to relayer...");
      setErrorDetails(`Authorization complete! Relayer will execute the stake.`);

      // Send to relayer (SIMPLE!)
      console.log('🎮 EIP7702Relayed: Sending transaction to relayer...');
      console.log('🎮 EIP7702Relayed: Relayer URL:', RELAYER_URL);

      const relayPayload = {
        authorization: {
          contractAddress: authorization.contractAddress,
          chainId: authorization.chainId,
          nonce: authorization.nonce.toString(),
          r: authorization.r,
          s: authorization.s,
          yParity: authorization.yParity,
        },
        amount: stakeAmount.toString(), // Just the amount, no signatures needed!
      };

      console.log('🎮 EIP7702Relayed: Request payload:', relayPayload);

      const response = await fetch(RELAYER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relayPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('🎮 EIP7702Relayed: Relay failed:', result);
        throw new Error(result.error || 'Relay failed');
      }

      console.log('🎮 EIP7702Relayed: Transaction relayed successfully! Hash:', result.txHash);
      setTxHash(result.txHash);
      setStatus(`🎉 Transaction relayed! Hash: ${result.txHash}`);
      setErrorDetails(`Transaction relayed successfully!\nHash: ${result.txHash}\n\n✨ GASLESS TRANSACTION ✨\nThe relayer paid the gas for you!`);

      // Wait for confirmation
      console.log('🎮 EIP7702Relayed: Waiting for transaction confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash: result.txHash });
      console.log('🎮 EIP7702Relayed: Transaction confirmed!', {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });
      setStatus(`✅ MOLOCH SLAIN GASELESSLY! Block: ${receipt.blockNumber}`);
      setErrorDetails(`Success!\nBlock: ${receipt.blockNumber}\nGas Used: ${receipt.gasUsed}\n\n✨ GASLESS VICTORY ✨\nYou didn't pay any gas!`);
    } catch (error: any) {
      console.error('🎮 EIP7702Relayed: Transaction failed:', error);
      console.error('🎮 EIP7702Relayed: Error details:', {
        message: error.message,
        cause: error.cause,
        details: error.details,
        shortMessage: error.shortMessage
      });
      setStatus(`❌ Relayed Transaction Failed`);

      let detailedError = error.message || 'Unknown error';

      // Check for specific relayer errors
      if (error.message.includes('Chain ID mismatch')) {
        detailedError = 'Chain mismatch - relayer is on different network';
      } else if (error.message.includes('fetch')) {
        detailedError = `Relayer service unavailable at ${RELAYER_URL}`;
      }

      if (error.cause) {
        try {
          detailedError += `\n\nCause: ${JSON.stringify(error.cause, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)}`;
        } catch {
          detailedError += `\n\nCause: ${String(error.cause)}`;
        }
      }
      if (error.details) {
        detailedError += `\n\nDetails: ${error.details}`;
      }

      setErrorDetails(detailedError);
    }
  };

  const mintTestTokens = async () => {
    try {
      if (!cardAddress) {
        setStatus("Please connect your NFC card first!");
        return;
      }

      setErrorDetails("");
      setStatus("Minting test tokens directly...");

      // For simplicity, let's just mint directly without the relayer
      // since TestERC20 has a public mint function
      // In production, you'd want a proper minting mechanism

      console.log('🎮 EIP7702Relayed: Minting tokens directly to:', cardAddress);

      // Create a simple wallet client that can send transactions
      // This would normally require the user to have ETH for gas
      setStatus("⚠️ Direct minting requires ETH for gas");
      setErrorDetails("Note: TestERC20 has a public mint function.\nFor gasless minting, you'd need a dedicated mint relayer or faucet.");

      // For now, just show instructions
      setStatus("💡 To mint tokens: Use a wallet with ETH or request from faucet");
      setErrorDetails(`Your address: ${cardAddress}\n\nTo mint tokens:\n1. Get some ETH on Optimism Sepolia\n2. Call mint() on token contract: ${CONTRACTS.testToken}\n\nOr use the faucet at: https://sepolia-optimism.etherscan.io/address/${CONTRACTS.testToken}#writeContract`);
    } catch (error: any) {
      console.error('🎮 EIP7702Relayed: Mint info failed:', error);
      setStatus(`❌ Error`);
      setErrorDetails(error.message);
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
      setErrorDetails(`Address: ${cardAddress}\nETH Balance: ${ethBalance.toString()} wei (${ethInEther} ETH)\nTEST Balance: ${(tokenBalance as bigint).toString()} wei (${tokenInEther} TEST)\n\n💡 Note: With relayer, you don't need ETH for gas!`);
    } catch (error: any) {
      console.error('🎮 EIP7702Relayed: Balance check failed:', error);
      setStatus(`❌ Balance check failed`);
      setErrorDetails(error.message);
    }
  };

  return (
    <div
      className="eip7702-relayed-demo"
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
        ⚔️ GASLESS EIP-7702 DEMON SLAYING ⚔️
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
          ✨ GASLESS BLOOD RITUAL (ONE TAP!):
        </h2>
        <ol style={{ color: "#ff9999", lineHeight: "2", fontSize: "18px" }}>
          <li>Connect your NFC Slayer's Seal</li>
          <li>ONE TAP: Sign EIP-7702 authorization</li>
          <li>Relayer executes approve + stake WITHOUT GAS!</li>
          <li>Moloch falls with a SINGLE BLOW!</li>
        </ol>
        <div style={{
          marginTop: "15px",
          padding: "10px",
          background: "rgba(0,255,0,0.1)",
          border: "1px solid #00ff00",
          borderRadius: "5px",
          color: "#00ff00"
        }}>
          💎 <strong>NO ETH NEEDED!</strong> The relayer pays all gas fees!
        </div>
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
            onClick={executeRelayedStake}
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
            ⚔️ SLAY MOLOCH (GASLESS) ⚔️
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
            Mint Test Tokens (Gasless)
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
            Check Balances
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
          <strong>✨ GASLESS SLAYER'S ADVANTAGE:</strong>
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>💎 NO ETH NEEDED - Relayer pays all gas!</li>
          <li>🩸 ONE TAP ONLY - Just the authorization!</li>
          <li>⚡ Whitelisted relayer for security</li>
          <li>🗡️ Works on Optimism Sepolia with StakerWallet</li>
          <li>🔥 Guard your NFC card - it holds your key!</li>
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
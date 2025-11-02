import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http, createPublicClient } from "viem";
import { type PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { ConnectCard } from "../components/ConnectCard";
import { PageWrapper } from "../components/PageWrapper";
import { CHAIN } from "../config/chain";
import { useAppContext } from "../contexts/AppContext";
import { createNFCAccount, getCardData } from "../lib/nfc";
import { checkBalances } from "../utils/balances";
import { calculateTotalHoldings } from "../utils/staking";

export function ConnectPage() {
  const { actions } = useAppContext();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(),
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Reset all state from previous connection
      actions.resetAll();

      let address: `0x${string}`;
      let account: ReturnType<typeof createNFCAccount> | PrivateKeyAccount;

      // Check if we have a stored generated wallet in sessionStorage
      const storedPrivateKey = sessionStorage.getItem("generatedWallet");

      if (storedPrivateKey) {
        // Use stored generated wallet from sessionStorage (test-only mode)
        console.log("🔗 Connect: Using stored generated wallet");
        account = privateKeyToAccount(storedPrivateKey as `0x${string}`);
        address = account.address;

        // Store in AppContext
        actions.setConnection({
          connectedAddress: address,
          account,
          isGeneratedWallet: true,
        });
      } else {
        // Connect NFC - always prompt for tap (NFC accounts don't persist)
        console.log("🔗 Connect: Reading NFC card...");
        const cardData = await getCardData();
        address = cardData.address;
        account = createNFCAccount(address);

        // Store in AppContext
        actions.setConnection({
          connectedAddress: address,
          account,
          isGeneratedWallet: false,
        });
      }

      console.log("🔗 Connect: Connected to:", address);

      // Check balances
      console.log("🔗 Connect: Checking balances...");
      const balances = await checkBalances(publicClient, address);
      actions.setBalances(balances);

      // Calculate total holdings (wallet + staked)
      const totalHoldings = calculateTotalHoldings(
        balances.walletBalance,
        balances.existingStakes,
      );

      console.log("🔗 Connect: Balances:", {
        wallet: balances.walletBalance.toString(),
        stakes: balances.existingStakes.size,
        total: totalHoldings.toString(),
      });

      // Check for zero total balance (wallet + stakes)
      if (totalHoldings === 0n) {
        console.log("🔗 Connect: Zero balance detected");
        setError("Your wallet has 0 GTC.");
        return;
      }

      // Navigate based on existing stakes
      if (balances.existingStakes.size > 0) {
        console.log("🔗 Connect: Has existing stakes, navigating to /slain");
        navigate("/slain");
      } else {
        console.log("🔗 Connect: No stakes, navigating to /choices");
        navigate("/choices");
      }
    } catch (err) {
      console.error("🔗 Connect: Connection failed:", err);

      // Show user-friendly error message below the button
      const errorObj = err instanceof Error ? err : new Error(String(err));
      let errorMessage = "Failed to connect. Please try again.";

      if (
        errorObj.message.includes("WebAuthn") ||
        errorObj.message.includes("NFC")
      ) {
        errorMessage = `NFC cards are only supported on mobile Chrome or Safari.
          Desktop use is not supported.
          If already using the correct browser, try refreshing.
          You must use the Chrome/Safari app directly, not—for example—through the Telegram internal browser.`;
      } else if (errorObj.message.includes("timeout")) {
        errorMessage = "Connection timed out. Please try again.";
      } else if (
        errorObj.message.includes("network") ||
        errorObj.message.includes("fetch")
      ) {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <PageWrapper>
      <ConnectCard
        onConnect={handleConnect}
        error={error}
        isConnecting={isConnecting}
      />
    </PageWrapper>
  );
}

import { useEffect, useState } from "react";
import { createPublicClient, formatEther, http, type Address } from "viem";
import { CHAIN, CHAIN_ID } from "../config/chain";
import { CONTRACTS, STAKER_WALLET_ABI } from "../config/contracts";
import { CHOICE_ID_MAPPING, CHOICE_NAMES } from "../utils/balances";
import styles from "./StatsPage.module.css";

// ERC6909 ABI with totalSupply
const ERC6909_TOTAL_SUPPLY_ABI = [
  {
    inputs: [{ name: "id", type: "uint256" }],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
] as const;

interface WithdrawalStats {
  totalWithdrawals: number;
  uniqueWithdrawers: number;
}

interface TokenStats {
  choiceName: string;
  totalSupply: bigint;
  estimatedStakers: number;
}

// Truncate to tenths (don't round up) - for token amounts
function truncateToTenths(value: number): number {
  return Math.floor(value * 10) / 10;
}

// Round UP to tenths - for people counts
function roundUpToTenths(value: number): number {
  return Math.ceil(value * 10) / 10;
}

// Format token amount truncated to tenths
function formatTokenAmount(wei: bigint): string {
  const tokens = Number(formatEther(wei));
  return truncateToTenths(tokens).toFixed(1);
}

export function StatsPage() {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("etherscan_api_key") || ""
  );
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalStats, setWithdrawalStats] = useState<WithdrawalStats | null>(null);
  const [tokenStats, setTokenStats] = useState<TokenStats[]>([]);
  const [relayerAddress, setRelayerAddress] = useState<Address | null>(null);

  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(),
  });

  // Fetch relayer address and token stats on mount
  useEffect(() => {
    async function getRelayerAddress() {
      try {
        const address = await publicClient.readContract({
          address: CONTRACTS.stakerWallet,
          abi: STAKER_WALLET_ABI,
          functionName: "relayer",
        });
        setRelayerAddress(address as Address);
      } catch (err) {
        console.error("Failed to fetch relayer address:", err);
        setError("Failed to fetch relayer address from contract");
      }
    }
    getRelayerAddress();
    fetchTokenStats();
  }, []);

  async function fetchAllTransactions(apiKey: string, relayerAddr: Address): Promise<any[]> {
    const allTxs: any[] = [];
    let page = 1;
    const offset = 10000; // Max per page

    while (true) {
      const response = await fetch(
        `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}&module=account&action=txlist&address=${relayerAddr}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${apiKey}`
      );

      const data = await response.json();

      if (data.status !== "1") {
        if (page === 1) {
          // First page failed - throw error
          throw new Error(data.result || "Failed to fetch transactions");
        }
        // Subsequent pages - just break
        break;
      }

      if (!data.result || data.result.length === 0) {
        break; // No more results
      }

      allTxs.push(...data.result);

      // If we got less than max, we're done
      if (data.result.length < offset) {
        break;
      }

      page++;
    }

    return allTxs;
  }

  async function fetchTokenStats() {
    setError(null);

    try {
      const tokenStatsPromises = CHOICE_NAMES.map(async (choiceName) => {
        const choiceId = CHOICE_ID_MAPPING[choiceName];
        const totalSupply = await publicClient.readContract({
          address: CONTRACTS.stakeChoicesToken,
          abi: ERC6909_TOTAL_SUPPLY_ABI,
          functionName: "totalSupply",
          args: [BigInt(choiceId)],
        });

        // Estimate stakers: total supply / 100 (since most stake ~100 tokens)
        // Round UP to nearest tenth for people counts
        const rawStakers = Number(formatEther(totalSupply)) / 100;
        const estimatedStakers = roundUpToTenths(rawStakers);

        return {
          choiceName,
          totalSupply,
          estimatedStakers: estimatedStakers || 0,
        };
      });

      const tokenStatsResults = await Promise.all(tokenStatsPromises);
      setTokenStats(tokenStatsResults);
    } catch (err) {
      console.error("Token stats fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch token stats");
    }
  }

  async function fetchWithdrawalStats() {
    if (!apiKey.trim()) {
      setError("Please enter your Etherscan API key");
      return;
    }

    if (!relayerAddress) {
      setError("Relayer address not loaded yet. Please wait...");
      return;
    }

    setLoadingWithdrawals(true);
    setError(null);

    try {
      // Save API key for next time
      localStorage.setItem("etherscan_api_key", apiKey);

      // Fetch ALL relayer transactions from Etherscan (with pagination)
      const allTransactions = await fetchAllTransactions(apiKey, relayerAddress);

      // Filter for successful transactions only
      const successfulTxs = allTransactions.filter(
        (tx: any) => tx.txreceipt_status === "1" && tx.isError === "0"
      );

      // Filter for withdrawals
      const withdrawals = successfulTxs.filter(
        (tx: any) =>
          tx.input.startsWith("0x51cff8d9") || // withdraw(address)
          tx.input.startsWith("0x321c2d4b") // unstakeAllAndWithdraw
      );

      // Count unique withdrawers
      const uniqueWithdrawers = new Set(
        withdrawals.map((tx: any) => tx.to.toLowerCase())
      );

      setWithdrawalStats({
        totalWithdrawals: withdrawals.length,
        uniqueWithdrawers: uniqueWithdrawers.size,
      });
    } catch (err) {
      console.error("Withdrawal stats fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch withdrawal stats");
    } finally {
      setLoadingWithdrawals(false);
    }
  }

  const totalStaked = tokenStats.reduce(
    (sum, stat) => sum + stat.totalSupply,
    0n
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>📊 Analytics</h1>

        {/* Chain Info */}
        <div className={styles.chainInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Chain:</span>
            <span className={styles.infoValue}>
              {CHAIN.name} (ID: {CHAIN_ID})
            </span>
          </div>
          {relayerAddress && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Relayer:</span>
              <span className={styles.infoValue}>
                {relayerAddress.slice(0, 6)}...{relayerAddress.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Stats Display */}
        {tokenStats.length > 0 && (
          <div className={styles.statsGrid}>
            {/* Stakers Graph */}
            {tokenStats.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Distribution</h2>
                <div className={styles.graphContainer}>
                  {tokenStats.map((stat) => {
                    const totalStakers = tokenStats.reduce((sum, s) => sum + s.estimatedStakers, 0);
                    const percentage = (stat.estimatedStakers / totalStakers) * 100;
                    const maxStakers = Math.max(...tokenStats.map(s => s.estimatedStakers));
                    const barWidth = (stat.estimatedStakers / maxStakers) * 100;

                    return (
                      <div key={stat.choiceName} className={styles.graphRow}>
                        <div className={styles.graphLabel}>
                          <span className={styles.graphChoiceName}>{stat.choiceName}</span>
                          <span className={styles.graphValue}>{Math.round(percentage)}%</span>
                        </div>
                        <div className={styles.graphBarContainer}>
                          <div
                            className={styles.graphBar}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Token Stats */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Numbers</h2>
              <div className={styles.choicesList}>
                {tokenStats.map((stat) => (
                  <div key={stat.choiceName} className={styles.choiceRow}>
                    <span className={styles.choiceName}>
                      {stat.choiceName}
                    </span>
                    <span className={styles.choiceValue}>
                      {formatTokenAmount(stat.totalSupply)} tokens
                    </span>
                    <span className={styles.choiceStakers}>
                      ~{stat.estimatedStakers.toFixed(1)} stakers
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total Staked</span>
                <span className={styles.totalValue}>
                  {formatTokenAmount(totalStaked)} tokens
                </span>
              </div>
            </div>

            {/* Withdrawal Stats */}
            {withdrawalStats && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>💰 Withdrawal Activity</h2>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Withdrawals</span>
                  <span className={styles.statValue}>
                    {withdrawalStats.totalWithdrawals}
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Unique Withdrawers</span>
                  <span className={styles.statValue}>
                    {withdrawalStats.uniqueWithdrawers}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Key Input - Only for Withdrawals (hide once loaded) */}
        {!withdrawalStats && (
          <div className={styles.apiKeySection}>
            <label htmlFor="apiKey" className={styles.label}>
              Etherscan API Key (for withdrawal stats)
            </label>
            <input
              id="apiKey"
              type="password"
              className={styles.input}
              placeholder="Free at etherscan.io/apis"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              className={styles.button}
              onClick={fetchWithdrawalStats}
              disabled={loadingWithdrawals}
            >
              {loadingWithdrawals ? "Loading..." : "Load Withdrawal Statistics"}
            </button>
            <p className={styles.hint}>
              Your API key is stored locally in your browser
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

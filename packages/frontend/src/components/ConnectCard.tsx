import type React from "react";
import { Link } from "react-router-dom";
import { ASSETS } from "../config/assets";
import { CHAIN_ID } from "../config/chain";
import { Button } from "./Button";
import styles from "./ConnectCard.module.css";
import { GameCard } from "./GameCard";

export interface ConnectCardProps {
  /** Callback when connect button is clicked */
  onConnect?: () => void;
  /** Error message to display */
  error?: string | null;
  /** Connection status */
  connectStatus?: "idle" | "processing" | "waiting_for_tap";
}

// Icon components
const HeartIcon = () => (
  <img
    src={ASSETS.heartIcon}
    alt=""
    style={{ width: "28px", height: "28px", display: "block" }}
  />
);

export const ConnectCard: React.FC<ConnectCardProps> = ({
  onConnect,
  error,
  connectStatus = "idle",
}) => {
  const isConnecting = connectStatus !== "idle";

  return (
    <GameCard
      variant="connect"
      heading="Slayers of Moloch"
      headingIcons={[<HeartIcon key="1" />, <HeartIcon key="2" />]}
      subheading="Burner Card"
      heroImage={ASSETS.burnerTap}
      heroImageAlt="Tap your burner card"
      primaryAction={
        <Button variant="outline" onClick={onConnect} disabled={isConnecting}>
          Connect
        </Button>
      }
    >
      {connectStatus === "processing" ? (
        <div className={styles.statusText}>
          <p>Preparing...</p>
        </div>
      ) : connectStatus === "waiting_for_tap" ? (
        <div className={styles.statusText}>
          <p>Tap your card when prompted...</p>
        </div>
      ) : error ? (
        <div className={styles.errorText}>
          <p>{error}</p>
          {/* Show helpful info for passcode-related errors */}
          {(error.toLowerCase().includes("passcode") ||
            error.toLowerCase().includes("authenticate")) && (
            <p>
              If you haven't initialized your card yet, visit{" "}
              <a
                href="https://boot.burner.pro"
                target="_blank"
                rel="noopener noreferrer"
              >
                boot.burner.pro
              </a>{" "}
              to set it up first.
            </p>
          )}
          {/* Show testnet-only helper links on Optimism Sepolia */}
          {CHAIN_ID === 11155420 && (
            <>
              {/* Link for NFC connection errors */}
              {(error.includes("NFC") || error.includes("WebAuthn")) && (
                <p className={styles.testnetLink}>
                  <Link to="/test">
                    Go to the test page to generate a test hot wallet (this works on both desktop and mobile)
                  </Link>
                </p>
              )}
              {/* Link for zero balance errors */}
              {error.includes("0 GTC") && (
                <p className={styles.testnetLink}>
                  <Link to="/test">Get testnet GTC for your burner</Link>
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className={styles.detailText}>
          <p>
            You have been given 100 GTC to allocate in the fight against{" "}
            <span className={styles.molochText}>Moloch</span>.
          </p>
          <p>Once connected, choose your allocation—your GTC splits evenly.</p>
          <p>
            When prompted, hold your{" "}
            <span className={styles.burnerText}>Burner</span> card flat against
            the top of your phone. Safely ignore any prompts about an NFC Tag
            URL.
          </p>
        </div>
      )}
    </GameCard>
  );
};

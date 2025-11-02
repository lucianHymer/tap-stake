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
  /** Whether connection is in progress */
  isConnecting?: boolean;
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
  isConnecting,
}) => {
  return (
    <GameCard
      variant="connect"
      heading="Slayers of Moloch"
      headingIcons={[<HeartIcon key="1" />, <HeartIcon key="2" />]}
      subheading="Burner Card"
      heroImage={ASSETS.burnerTap}
      heroImageAlt="Tap your burner card"
      primaryAction={
        <Button variant="outline" onClick={onConnect}>
          Connect
        </Button>
      }
    >
      {isConnecting ? (
        <div className={styles.statusText}>
          <p>Tap your card when prompted...</p>
        </div>
      ) : error ? (
        <div className={styles.errorText}>
          <p>{error}</p>
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
                  <Link to="/test">Mint test GTC to your burner here</Link>
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

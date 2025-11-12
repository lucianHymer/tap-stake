import type React from "react";
import { useState } from "react";
import { ASSETS } from "../config/assets";
import { SwordIcon } from "../utils/classHelpers";
import { AddressInput } from "./AddressInput";
import { Button } from "./Button";
import { GameCard } from "./GameCard";
import styles from "./WithdrawCard.module.css";

export interface WithdrawCardProps {
  /** Callback when Run Away button is clicked */
  onRunAway?: (destinationAddress: string) => void;
  /** Callback when Go Back button is clicked */
  onGoBack?: () => void;
  /** Transaction status for showing simple status in card body */
  transactionStatus?: "idle" | "processing" | "signing" | "submitting" | "success" | "error";
  /** Transaction error message */
  transactionError?: string | null;
  /** Amount being withdrawn (for success message) */
  withdrawAmount?: string;
  /** Destination address (for success message) */
  destinationAddress?: string;
}

export const WithdrawCard: React.FC<WithdrawCardProps> = ({
  onRunAway,
  onGoBack,
  transactionStatus = "idle",
  transactionError,
  withdrawAmount,
  destinationAddress: successDestination,
}) => {
  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null,
  );

  const handleRunAway = () => {
    if (destinationAddress && onRunAway) {
      onRunAway(destinationAddress);
    }
  };

  // Format destination address for success message
  const formatAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <GameCard
      variant="default"
      heading="Moloch Rises"
      headingIcons={[<SwordIcon key="sword" />]}
      subheading="Discoordination"
      heroImage={ASSETS.heroRises}
      heroImageAlt="Moloch demon rising with warriors fleeing"
      primaryAction={
        <div className={styles.controlPanel}>
          <Button
            variant="primary"
            onClick={handleRunAway}
            disabled={!destinationAddress || transactionStatus !== "idle"}
          >
            Run Away
          </Button>
          <Button
            variant="cancel"
            leftIcon={ASSETS.xIcon}
            rightIcon={ASSETS.xIcon}
            onClick={onGoBack}
            disabled={transactionStatus !== "idle"}
          >
            Go Back
          </Button>
        </div>
      }
    >
      {transactionStatus !== "idle" ? (
        <div className={styles.transactionStatus}>
          {transactionStatus === "processing" && (
            <p className={styles.statusText}>Preparing...</p>
          )}
          {transactionStatus === "signing" && (
            <p className={styles.statusText}>Tap your card when prompted...</p>
          )}
          {transactionStatus === "submitting" && (
            <p className={styles.statusText}>Submitting withdrawal...</p>
          )}
          {transactionStatus === "success" && (
            <p className={styles.statusText}>
              Successfully withdrew {withdrawAmount} GTC to{" "}
              {successDestination
                ? formatAddress(successDestination)
                : "your address"}
            </p>
          )}
          {transactionStatus === "error" && (
            <p className={styles.errorText}>
              {transactionError || "Withdrawal failed"}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.detailsContent}>
          <h2 className={styles.runningHeading}>Running Away</h2>
          <p className={styles.bodyText}>
            You may choose to run away from the fight against Moloch, taking
            your 100 GTC with you.
          </p>
          <AddressInput
            label="Where should we send your GTC?"
            placeholder="0x... or vitalik.eth"
            onAddressChange={(address) => setDestinationAddress(address)}
          />
        </div>
      )}
    </GameCard>
  );
};

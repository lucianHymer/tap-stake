import type React from "react";
import { formatEther } from "viem";
import { ASSETS } from "../config/assets";
import { getExplorerUrl } from "../config/chain";
import { SwordIcon, getClassIcon } from "../utils/classHelpers";
import { Button } from "./Button";
import { GameCard } from "./GameCard";
import styles from "./SlainCard.module.css";

export interface SlainCardProps {
  /** Character class name */
  characterClass: string;
  /** Stakes map (choiceId -> amount) */
  stakes: Map<string, bigint>;
  /** Choice display names */
  choiceNames: Record<string, string>;
  /** Connected address */
  connectedAddress?: string;
  /** Callback when Start Over is clicked */
  onStartOver?: () => void;
  /** Optional backside content for flippable card */
  heroImageBackside?: React.ReactNode;
}

// Abbreviate address for display (0x1234...5678)
const abbreviateAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format stake amount - truncated to 1 decimal
const formatStakeAmount = (amount: bigint): string => {
  const fullAmount = Number(formatEther(amount));
  return (Math.floor(fullAmount * 10) / 10).toString();
};

export const SlainCard: React.FC<SlainCardProps> = ({
  characterClass,
  stakes,
  choiceNames,
  connectedAddress,
  onStartOver,
  heroImageBackside,
}) => {
  // Get whitepaper URL from env or use fallback
  const whitepaperUrl =
    import.meta.env.VITE_WHITEPAPER_URL || "https://www.google.com";

  // Get class-specific image
  const classImages =
    ASSETS.classImages[characterClass as keyof typeof ASSETS.classImages] ||
    ASSETS.classImages.Artificer;

  return (
    <GameCard
      variant="default"
      heading="Moloch is Slain!"
      headingIcons={[<SwordIcon key="sword" />]}
      subheading={characterClass}
      subheadingIcon={getClassIcon(characterClass)}
      heroImage={classImages.slain}
      heroImageAlt="Moloch defeated"
      heroImageBackside={heroImageBackside}
      primaryAction={
        <div className={styles.controlPanel}>
          <a
            href={whitepaperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.whitepaperButton} ${styles.outlineButton}`}
          >
            View Whitepaper
          </a>
          <Button
            variant="cancel"
            leftIcon={ASSETS.xIcon}
            rightIcon={ASSETS.xIcon}
            onClick={onStartOver}
          >
            Start Over
          </Button>
        </div>
      }
    >
      <div className={styles.detailsContent}>
        <ul className={styles.stakeList}>
          {Array.from(stakes.entries()).map(([choiceId, amount]) => (
            <li key={choiceId} className={styles.stakeItem}>
              <span className={styles.choiceName}>
                {choiceNames[choiceId] || choiceId}
              </span>
              <span className={styles.amount}>
                {formatStakeAmount(amount)} GTC
              </span>
            </li>
          ))}
        </ul>

        <p className={styles.bodyText}>
          Your stake has been recorded on the blockchain. The forces of
          coordination grow stronger.
        </p>

        {connectedAddress && (
          <div className={styles.slayerAddress}>
            <span className={styles.slayerLabel}>Slayer:</span>{" "}
            <a
              href={getExplorerUrl(connectedAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.addressLink}
            >
              {abbreviateAddress(connectedAddress)}
            </a>
          </div>
        )}
      </div>
    </GameCard>
  );
};

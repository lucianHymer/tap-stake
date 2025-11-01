import type React from 'react';
import { useState } from 'react';
import { GameCard } from './GameCard';
import { Button } from './Button';
import { AddressInput } from './AddressInput';
import { ASSETS } from '../config/assets';
import styles from './MolochRisesCard.module.css';

export interface MolochRisesCardProps {
  /** Callback when Run Away button is clicked */
  onRunAway?: (destinationAddress: string) => void;
  /** Callback when Go Back button is clicked */
  onGoBack?: () => void;
}

// Icon components
const SwordIcon = () => (
  <img src={ASSETS.swordIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

export const MolochRisesCard: React.FC<MolochRisesCardProps> = ({ onRunAway, onGoBack }) => {
  const [destinationAddress, setDestinationAddress] = useState<string | null>(null);

  const handleRunAway = () => {
    if (destinationAddress && onRunAway) {
      onRunAway(destinationAddress);
    }
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
          <Button variant="primary" onClick={handleRunAway} disabled={!destinationAddress}>
            Run Away
          </Button>
          <Button
            variant="cancel"
            leftIcon={ASSETS.xIcon}
            rightIcon={ASSETS.xIcon}
            onClick={onGoBack}
          >
            Go Back
          </Button>
        </div>
      }
    >
      <div className={styles.detailsContent}>
        <h2 className={styles.runningHeading}>Running Away</h2>
        <p className={styles.bodyText}>
          You may choose to run away from the fight against Moloch, taking your 100 GTC with you.
        </p>
        <AddressInput
          label="Where should we send your GTC?"
          placeholder="0x... or vitalik.eth"
          onAddressChange={(address) => setDestinationAddress(address)}
        />
      </div>
    </GameCard>
  );
};

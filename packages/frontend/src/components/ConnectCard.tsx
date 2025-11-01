import type React from 'react';
import { GameCard } from './GameCard';
import { Button } from './Button';
import { ASSETS } from '../config/assets';
import styles from './ConnectCard.module.css';

export interface ConnectCardProps {
  /** Callback when connect button is clicked */
  onConnect?: () => void;
}

// Icon components
const HeartIcon = () => (
  <img src={ASSETS.heartIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

const HelmetIcon = () => (
  <img src={ASSETS.helmetIcon} alt="" style={{ width: '28px', height: '30px', display: 'block' }} />
);

export const ConnectCard: React.FC<ConnectCardProps> = ({ onConnect }) => {
  return (
    <GameCard
      variant="connect"
      heading="Slayers of Moloch"
      headingIcons={[<HeartIcon key="1" />, <HeartIcon key="2" />]}
      subheading="Connect"
      subheadingIcon={<HelmetIcon />}
      heroImage={ASSETS.heroMoloch}
      heroImageAlt="Hero battling Moloch"
      primaryAction={
        <Button variant="outline" onClick={onConnect}>
          Connect
        </Button>
      }
    >
      <div className={styles.detailText}>
        <p>You have been given 100 GTC to allocate in the fight against Moloch.</p>
      </div>
      <div className={styles.centerIllustration}>
        <img src={ASSETS.nfcCard} alt="NFC card tap animation" />
      </div>
      <div className={styles.detailText}>
        <p>Tap your Burner card at the top of your phone when prompted.</p>
      </div>
    </GameCard>
  );
};

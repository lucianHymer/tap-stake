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

export const ConnectCard: React.FC<ConnectCardProps> = ({ onConnect }) => {
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
      <div className={styles.detailText}>
        <p>You have been given 100 GTC to allocate in the fight against <span className={styles.molochText}>Moloch</span>.</p>
        <p>Once connected, you will choose how to allocate your GTC. It will be split evenly among your choices.</p>
        <p>Tap your <span className={styles.burnerText}>Burner</span> card at the top of your phone when prompted.</p>
      </div>
    </GameCard>
  );
};

import type React from 'react';
import { GameCard } from './GameCard';
import { Button } from './Button';
import { ASSETS } from '../config/assets';
import styles from './SlainCard.module.css';

export interface SlainCardProps {
  /** Callback when Share to Twitter button is clicked */
  onShareTwitter?: () => void;
  /** Callback when Start Over button is clicked */
  onStartOver?: () => void;
}

// Icon components
const SwordIcon = () => (
  <img src={ASSETS.swordIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

const WandIcon = () => (
  <img src={ASSETS.wandIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

export const SlainCard: React.FC<SlainCardProps> = ({ onShareTwitter, onStartOver }) => {
  return (
    <GameCard
      variant="default"
      heading="Moloch is Slain!"
      headingIcons={[<SwordIcon key="sword" />]}
      subheading="Artificer"
      subheadingIcon={<WandIcon />}
      heroImage={ASSETS.heroSlain}
      heroImageAlt="Warrior victorious over slain Moloch"
      primaryAction={
        <div className={styles.controlPanel}>
          <Button variant="outline" onClick={onShareTwitter}>
            Share to Twitter
          </Button>
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
        <h2 className={styles.victoryHeading}>Moloch is Slain</h2>
        <p className={styles.bodyText}>Lorem ipsum bla bla bla bla bla</p>
      </div>
    </GameCard>
  );
};

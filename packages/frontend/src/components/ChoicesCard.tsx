import React, { useState } from 'react';
import { GameCard } from './GameCard';
import { Button } from './Button';
import { ChoiceToggle } from './ChoiceToggle';
import { ASSETS } from '../config/assets';
import styles from './ChoicesCard.module.css';

interface ChoiceToggleStats {
  major: string;
  minor: string;
}

export interface ChoicesCardProps {
  /** Callback when Slay Moloch button is clicked */
  onSlayMoloch?: () => void;
  /** Callback when Run Away button is clicked */
  onRunAway?: () => void;
}

// Icon components
const SwordIcon = () => (
  <img src={ASSETS.swordIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

const WandIcon = () => (
  <img src={ASSETS.wandIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

// Choice data
interface Choice {
  id: string;
  name: string;
  stats: ChoiceToggleStats;
}

const CHOICES: Choice[] = [
  { id: 'giveth', name: 'Giveth', stats: { major: '++charisma', minor: '+intelligence' } },
  { id: 'karma', name: 'Karma', stats: { major: '++wisdom', minor: '+intelligence' } },
  { id: 'gardens', name: 'Gardens', stats: { major: '++charisma', minor: '+wisdom' } },
  { id: 'deepfunding', name: 'Deep Funding', stats: { major: '++intelligence', minor: '+wisdom' } },
  { id: 'privote', name: 'Privote', stats: { major: '++intelligence', minor: '+wisdom' } },
  { id: 'silvi', name: 'Silvi', stats: { major: '++wisdom', minor: '+charisma' } },
];

export const ChoicesCard: React.FC<ChoicesCardProps> = ({ onSlayMoloch, onRunAway }) => {
  // Initial selections: Giveth, Gardens, Silvi (from Figma)
  const [selectedChoices, setSelectedChoices] = useState<Set<string>>(
    new Set(['giveth', 'gardens', 'silvi'])
  );

  const toggleChoice = (id: string) => {
    setSelectedChoices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      console.log('Selected choices:', Array.from(newSet));
      return newSet;
    });
  };

  const handleSlayMoloch = () => {
    console.log('Slay Moloch clicked with choices:', Array.from(selectedChoices));
    onSlayMoloch?.();
  };

  const handleRunAway = () => {
    console.log('Run Away clicked');
    onRunAway?.();
  };

  return (
    <GameCard
      variant="default"
      heading="Choose your weapons..."
      headingIcons={[<SwordIcon key="sword" />]}
      subheading="Artificer"
      subheadingIcon={<WandIcon />}
      heroImage={ASSETS.heroChoices}
      heroImageAlt="Warrior battling demon in flames"
      heroImageBackside={
        <div className={styles.backContent}>
          <h2>Hidden Power Unlocked!</h2>
          <p>You have discovered the ancient weapons of coordination.</p>
          <p>These tools will aid you in your battle against Moloch.</p>
          <p>Click to keep viewing the front...</p>
        </div>
      }
      primaryAction={
        <div className={styles.controlPanel}>
          <Button variant="primary" onClick={handleSlayMoloch}>
            Slay Moloch.
          </Button>
          <Button
            variant="cancel"
            leftIcon={ASSETS.xIcon}
            rightIcon={ASSETS.xIcon}
            onClick={handleRunAway}
          >
            Run Away
          </Button>
        </div>
      }
    >
      <div className={styles.choicesGrid}>
        {CHOICES.map((choice) => (
          <ChoiceToggle
            key={choice.id}
            name={choice.name}
            stats={choice.stats}
            active={selectedChoices.has(choice.id)}
            onClick={() => toggleChoice(choice.id)}
          />
        ))}
      </div>
    </GameCard>
  );
};

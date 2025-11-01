import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { GameCard } from './GameCard';
import { Button } from './Button';
import { ChoiceToggle, type StatName } from './ChoiceToggle';
import { ASSETS } from '../config/assets';
import styles from './ChoicesCard.module.css';

interface ChoiceToggleStats {
  major: StatName;
  minor: StatName;
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
  { id: 'giveth', name: 'Giveth', stats: { major: 'charisma', minor: 'intelligence' } },
  { id: 'karma', name: 'Karma', stats: { major: 'wisdom', minor: 'intelligence' } },
  { id: 'gardens', name: 'Gardens', stats: { major: 'charisma', minor: 'wisdom' } },
  { id: 'deepfunding', name: 'Deep Funding', stats: { major: 'intelligence', minor: 'wisdom' } },
  { id: 'privote', name: 'Privote', stats: { major: 'intelligence', minor: 'wisdom' } },
  { id: 'silvi', name: 'Silvi', stats: { major: 'wisdom', minor: 'charisma' } },
];

export const ChoicesCard: React.FC<ChoicesCardProps> = ({ onSlayMoloch, onRunAway }) => {
  // Total amount to distribute among selected choices
  // Use setTotalAmount(newValue) to dynamically change the total
  const [totalAmount] = useState<number>(100);

  // Initial selections: Giveth, Gardens, Silvi (from Figma)
  const [selectedChoices, setSelectedChoices] = useState<Set<string>>(
    new Set(['giveth', 'gardens', 'silvi'])
  );

  // Calculate amount per choice (evenly distributed)
  // Returns the exact amount (not truncated) for backend use
  const getAmountPerChoice = (choiceId: string): number => {
    if (!selectedChoices.has(choiceId)) return 0;
    const selectedCount = selectedChoices.size;
    if (selectedCount === 0) return 0;
    return totalAmount / selectedCount;
  };

  // Get display amount (truncated to whole number)
  const getDisplayAmount = (choiceId: string): number => {
    return Math.floor(getAmountPerChoice(choiceId));
  };

  // Selected choices with full details (stats, name, exact amount) - derived state
  const selectedChoicesWithDetails = useMemo(() => {
    return CHOICES.filter((choice) => selectedChoices.has(choice.id)).map((choice) => ({
      id: choice.id,
      name: choice.name,
      stats: choice.stats,
      amount: getAmountPerChoice(choice.id), // Exact amount for backend
    }));
  }, [selectedChoices, totalAmount]);

  // Log selected choices with details whenever selection changes
  useEffect(() => {
    console.log('Selected choices updated:', {
      selectedIds: Array.from(selectedChoices),
      selectedCount: selectedChoices.size,
      totalAmount,
      amountPerChoice: selectedChoices.size > 0 ? totalAmount / selectedChoices.size : 0,
      choices: selectedChoicesWithDetails,
    });
  }, [selectedChoices, totalAmount, selectedChoicesWithDetails]);

  const toggleChoice = (id: string) => {
    setSelectedChoices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSlayMoloch = () => {
    console.log('Slay Moloch clicked with choices:', selectedChoicesWithDetails);
    console.log('Summary:', {
      totalAmount,
      selectedCount: selectedChoices.size,
      amountPerChoice: selectedChoices.size > 0 ? totalAmount / selectedChoices.size : 0,
      choices: selectedChoicesWithDetails.map((c) => ({
        name: c.name,
        stats: c.stats,
        amount: c.amount,
        displayAmount: Math.floor(c.amount),
      })),
    });
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
          <Button
            variant="primary"
            onClick={handleSlayMoloch}
            disabled={selectedChoices.size === 0}
          >
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
            amount={getDisplayAmount(choice.id)}
            active={selectedChoices.has(choice.id)}
            onClick={() => toggleChoice(choice.id)}
            animationStyle="pulse"
          />
        ))}
      </div>
    </GameCard>
  );
};

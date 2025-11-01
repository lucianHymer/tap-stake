import type React from 'react';
import { useEffect } from 'react';
import { LazyMotion, domAnimation, m, useMotionValue, useTransform, animate } from 'framer-motion';
import styles from './StatsDisplay.module.css';

export interface StatsDisplayProps {
  /** Stats object with charisma, intelligence, wisdom */
  stats: {
    charisma: number;
    intelligence: number;
    wisdom: number;
  };
  /** Character class name */
  className?: string;
  /** Character class for display */
  characterClass?: string;
  /** Primary stats for this class */
  primaryStats?: [string, string];
}

interface StatBarProps {
  label: string;
  value: number;
  color: 'green' | 'red' | 'purple';
  maxValue: number;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, color, maxValue }) => {
  // Base value is 1, so minimum width is never 0
  const displayValue = Math.max(1, value);

  // Motion value for animated bar width
  const motionWidth = useMotionValue(0);

  // Calculate percentage (1 is minimum, so 1/maxValue is minimum width)
  const targetPercent = (displayValue / maxValue) * 100;

  useEffect(() => {
    const controls = animate(motionWidth, targetPercent, {
      duration: 0.6,
      ease: [0.2, 0.8, 0.2, 1], // Emphatic easing
    });

    return controls.stop;
  }, [targetPercent, motionWidth]);

  return (
    <div className={styles.statRow}>
      <div className={`${styles.statLabel} ${styles[`label-${color}`]}`}>{label}</div>
      <div className={styles.barContainer}>
        <m.div
          className={`${styles.bar} ${styles[`bar-${color}`]}`}
          style={{
            width: useTransform(motionWidth, (w) => `${w}%`),
          }}
        />
      </div>
    </div>
  );
};

// Class-specific content - easy to edit per class
const CLASS_CONTENT: Record<string, string> = {
  Wizard: 'unravels the deepest mysteries of cooperation and conjures entirely new spells of unity.',
  Paladin: 'walks ahead with radiant conviction, showing everyone the path toward collective flourishing.',
  Bard: 'weaves inspiring tales and songs of what we can build together when hearts align.',
  Monk: 'channels inner balance outward through gentle presence, drawing all hearts into serene harmony.',
  Seer: 'peers through the mists of possibility to guide communities toward futures where all can flourish.',
  Artificer: 'mends fractured bonds and forges enchanted tools that draw hearts together in common cause.',
};

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  className = '',
  characterClass = 'Slayer',
  primaryStats,
}) => {
  // Handle "Decide" state differently
  if (characterClass === 'Decide') {
    return (
      <LazyMotion features={domAnimation}>
        <div className={`${styles.statsDisplay} ${className}`}>
          <div className={styles.classInfo}>
            <p className={styles.description}>
              You have 100 GTC to spread amongst these choices. It'll be spread evenly. Your choices
              will determine your stats and class.
            </p>
          </div>
        </div>
      </LazyMotion>
    );
  }

  // Calculate total of all stats for percentage-based scaling
  const totalStats = stats.charisma + stats.intelligence + stats.wisdom;

  // Sort stats by value (highest first)
  const sortedStats = [
    { label: 'Charisma', value: stats.charisma, color: 'green' as const },
    { label: 'Intelligence', value: stats.intelligence, color: 'red' as const },
    { label: 'Wisdom', value: stats.wisdom, color: 'purple' as const },
  ].sort((a, b) => b.value - a.value);

  // Get class-specific content or fall back to generic message
  const classContent = CLASS_CONTENT[characterClass] || 'channels coordination magic through chosen weapons to slay Moloch.';

  return (
    <LazyMotion features={domAnimation}>
      <div className={`${styles.statsDisplay} ${className}`}>
        <div className={styles.classInfo}>
          <p className={styles.description}>
            The <span className={styles.className}>{characterClass}</span>{' '}
            {primaryStats && (
              <span className={styles.statPair}>
                ({primaryStats[0]} + {primaryStats[1]})
              </span>
            )}{' '}
            {classContent}
          </p>
        </div>
        <div className={styles.statsContainer}>
          {sortedStats.map((stat) => (
            <StatBar
              key={stat.label}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              maxValue={totalStats}
            />
          ))}
        </div>
      </div>
    </LazyMotion>
  );
};

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

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  className = '',
  characterClass = 'Slayer',
  primaryStats,
}) => {
  // Calculate total of all stats for percentage-based scaling
  const totalStats = stats.charisma + stats.intelligence + stats.wisdom;

  // Sort stats by value (highest first)
  const sortedStats = [
    { label: 'Charisma', value: stats.charisma, color: 'green' as const },
    { label: 'Intelligence', value: stats.intelligence, color: 'red' as const },
    { label: 'Wisdom', value: stats.wisdom, color: 'purple' as const },
  ].sort((a, b) => b.value - a.value);

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
            {primaryStats
              /* Max 140 chars */
              ? 'channels coordination magic through chosen weapons to slay Moloch.channels coordination magic through chosen weapons to slay Moloch.channels'
              : 'awaits your weapon selection.'}
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

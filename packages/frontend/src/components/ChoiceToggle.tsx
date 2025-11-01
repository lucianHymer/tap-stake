import React, { useEffect } from 'react';
import { LazyMotion, domAnimation, m, useMotionValue, useTransform, animate } from 'framer-motion';
import styles from './ChoiceToggle.module.css';
import { ASSETS } from '../config/assets';

export type StatName = 'intelligence' | 'charisma' | 'wisdom';

export interface ChoiceToggleStats {
  major: StatName;
  minor: StatName;
}

export interface ChoiceToggleProps {
  name: string;
  stats: ChoiceToggleStats;
  amount: number;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export const ChoiceToggle: React.FC<ChoiceToggleProps> = ({
  name,
  stats,
  amount,
  active,
  onClick,
  className,
}) => {
  // Motion value for animated counter with duration-based animation
  const motionAmount = useMotionValue(0);

  // Transform to rounded integer for display
  const displayAmount = useTransform(motionAmount, (latest) => Math.floor(latest));

  // Animate to new amount when it changes
  useEffect(() => {
    const controls = animate(motionAmount, amount, {
      duration: 0.3,
      ease: 'easeOut',
    });

    return controls.stop;
  }, [amount, motionAmount]);

  return (
    <LazyMotion features={domAnimation}>
      <button
        className={`${styles.choiceToggle} ${
          active ? styles.active : styles.inactive
        } ${className || ''}`}
        onClick={onClick}
        type="button"
      >
        <div className={styles.container}>
          <div className={styles.name}>{name}</div>
          <div className={styles.bottom}>
            <div className={styles.stats}>
              <span>++{stats.major}</span>
              <span>+{stats.minor}</span>
            </div>
            <div className={styles.moneyBag}>
              <img src={ASSETS.moneyBag} alt={`${amount} GTC`} className={styles.moneyBagImg} />
              <m.span className={styles.amount}>{displayAmount}</m.span>
            </div>
          </div>
        </div>
      </button>
    </LazyMotion>
  );
};

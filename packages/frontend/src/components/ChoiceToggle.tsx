import type React from 'react';
import { useEffect } from 'react';
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
  /** Animation style to test: 'scale' | 'pulse' | 'rotate' | 'none' */
  animationStyle?: 'scale' | 'pulse' | 'rotate' | 'none';
}

export const ChoiceToggle: React.FC<ChoiceToggleProps> = ({
  name,
  stats,
  amount,
  active,
  onClick,
  className,
  animationStyle = 'scale',
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

  // Get animation props based on style
  const getAnimationProps = () => {
    switch (animationStyle) {
      case 'scale':
        return {
          whileTap: { scale: 0.95 },
          transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
        };
      case 'pulse':
        return {
          whileTap: { scale: 0.92 },
          transition: { duration: 0.08 },
        };
      case 'rotate':
        return {
          whileTap: { scale: 0.95, rotate: 2 },
          transition: { duration: 0.2 },
        };
      default:
        return {};
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <m.button
        className={`${styles.choiceToggle} ${
          active ? styles.active : styles.inactive
        } ${className || ''}`}
        onClick={onClick}
        type="button"
        {...getAnimationProps()}
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
      </m.button>
    </LazyMotion>
  );
};

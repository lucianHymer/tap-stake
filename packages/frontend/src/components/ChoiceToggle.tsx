import React from 'react';
import styles from './ChoiceToggle.module.css';
import { ASSETS } from '../config/assets';

export interface ChoiceToggleStats {
  major: string;
  minor: string;
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
  return (
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
            <span>{stats.major}</span>
            <span>{stats.minor}</span>
          </div>
          <div className={styles.moneyBag}>
            <img src={ASSETS.moneyBag} alt={`${amount} GTC`} className={styles.moneyBagImg} />
            <span className={styles.amount}>{amount}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

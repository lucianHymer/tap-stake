import React from 'react';
import styles from './ChoiceToggle.module.css';

export interface ChoiceToggleStats {
  major: string;
  minor: string;
}

export interface ChoiceToggleProps {
  name: string;
  stats: ChoiceToggleStats;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export const ChoiceToggle: React.FC<ChoiceToggleProps> = ({
  name,
  stats,
  active,
  onClick,
  className,
}) => {
  return (
    <button
      className={`${styles.choiceToggle} ${active ? styles.active : styles.inactive} ${className || ''}`}
      onClick={onClick}
      type="button"
    >
      <div className={styles.container}>
        <div className={styles.name}>{name}</div>
        <div className={styles.stats}>
          <span>{stats.major}</span>
          <span>{stats.minor}</span>
        </div>
      </div>
    </button>
  );
};

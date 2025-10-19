import React, { useState } from 'react';
import styles from './ToggleButton.module.css';

export interface ToggleButtonProps {
  label: string;
  onToggle?: (isOn: boolean) => void;
  className?: string;
  defaultOn?: boolean;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  onToggle,
  className,
  defaultOn = false,
}) => {
  const [isOn, setIsOn] = useState(defaultOn);

  const handleClick = () => {
    const newState = !isOn;
    setIsOn(newState);
    onToggle?.(newState);
  };

  return (
    <button
      className={`${styles.toggleButton} ${isOn ? styles.on : styles.off} ${className || ''}`}
      onClick={handleClick}
      type="button"
    >
      <div className={styles.track} />
      <div className={styles.thumb}>
        <div className={styles.label}>{label}</div>
      </div>
    </button>
  );
};

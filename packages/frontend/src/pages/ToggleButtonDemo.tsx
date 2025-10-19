import React from 'react';
import { ToggleButton } from '../components/ToggleButton';
import styles from './ToggleButtonDemo.module.css';

export const ToggleButtonDemo: React.FC = () => {
  const handleToggle = (isOn: boolean) => {
    console.log('Toggle state:', isOn ? 'ON' : 'OFF');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ToggleButton Demo</h1>
      <div className={styles.toggleWrapper}>
        <ToggleButton
          label="Slay Moloch"
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
};

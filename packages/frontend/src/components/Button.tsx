import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'cancel';
  children: React.ReactNode;
  leftIcon?: string;
  rightIcon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  return (
    <button className={`${styles.button} ${styles[variant]} ${className || ''}`} {...props}>
      {leftIcon && <img src={leftIcon} alt="" className={styles.icon} />}
      {children}
      {rightIcon && <img src={rightIcon} alt="" className={styles.icon} />}
    </button>
  );
};

import React from 'react';
import { LazyMotion, domAnimation, m, type HTMLMotionProps } from 'framer-motion';
import styles from './Button.module.css';

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children' | 'variant' | 'leftIcon' | 'rightIcon'> {
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
    <LazyMotion features={domAnimation}>
      <m.button
        className={`${styles.button} ${styles[variant]} ${className || ''}`}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {leftIcon && <img src={leftIcon} alt="" className={styles.icon} />}
        {children}
        {rightIcon && <img src={rightIcon} alt="" className={styles.icon} />}
      </m.button>
    </LazyMotion>
  );
};

import type React from 'react';
import styles from './PageWrapper.module.css';

export interface PageWrapperProps {
  /** Content to render inside the page wrapper */
  children: React.ReactNode;
  /** Optional additional className for the content area */
  className?: string;
}

/**
 * Common page wrapper providing fullscreen layout with centered content.
 * GameCard components inside will naturally constrain to 440x956.
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.pageContent} ${className}`}>{children}</div>
    </div>
  );
};

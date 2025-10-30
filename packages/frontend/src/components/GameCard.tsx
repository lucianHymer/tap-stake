import React from 'react';
import styles from './GameCard.module.css';

export interface GameCardProps {
  /** Card variant - determines the state/style */
  variant?: 'connect' | 'default';
  /** Main heading text */
  heading: string;
  /** Icon elements for heading (hearts, etc) */
  headingIcons?: React.ReactNode[];
  /** Subheading text */
  subheading: string;
  /** Icon element for subheading */
  subheadingIcon?: React.ReactNode;
  /** Hero/main image URL */
  heroImage: string;
  /** Alt text for hero image */
  heroImageAlt?: string;
  /** Details section content */
  children?: React.ReactNode;
  /** Primary action button */
  primaryAction: React.ReactNode;
  /** Optional className */
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  variant = 'default',
  heading,
  headingIcons = [],
  subheading,
  subheadingIcon,
  heroImage,
  heroImageAlt = '',
  children,
  primaryAction,
  className = '',
}) => {
  return (
    <div className={`${styles.card} ${className}`} data-variant={variant}>
      {/* Border wrapper */}
      <div className={styles.border} />

      {/* This background border prevents scrolled content from peaking from behind the header */}
      <div className={styles.background } />

          <div className={styles.headingContainer}>
            {/* Heading pill - extends beyond image */}
            <div className={styles.heading}>
              <p>{heading}</p>
              {headingIcons.map((icon, i) => (
                <div key={i} className={styles.headingIcon}>
                  {icon}
                </div>
              ))}
            </div>
          </div>

      {/* Main content */}
      <div className={styles.contents}>
        {/* Top section with image and overlays */}
        <div className={styles.topSection}>
          {/* Hero image - full width with padding */}
          <img
            src={heroImage}
            alt={heroImageAlt}
            className={styles.heroImage}
          />

          <div className={styles.subheadingContainer}>
            {/* Subheading pill - contained within image */}
            <div className={styles.subheading}>
              <p>{subheading}</p>
              {subheadingIcon && (
                <div className={styles.subheadingIcon}>
                  {subheadingIcon}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details section */}
        <div className={styles.detailsSection}>
          {children}
        </div>

      </div>
      {/* Control panel */}
      <div className={styles.controlPanel}>
      {primaryAction}
      </div>
    </div>
  );
};

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
  /** Detail text paragraphs */
  detailText?: string[];
  /** Center illustration (like NFC card graphic) */
  centerIllustration?: {
    src: string;
    alt: string;
  };
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
  detailText = [],
  centerIllustration,
  primaryAction,
  className = '',
}) => {
  return (
    <div className={`${styles.card} ${className}`} data-variant={variant}>
      {/* Border wrapper */}
      <div className={styles.border} />

      {/* Main content */}
      <div className={styles.contents}>
        {/* Top section with image and overlays */}
        <div className={styles.topSection}>
          {/* Hero image */}
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <img
                src={heroImage}
                alt={heroImageAlt}
                className={styles.heroImage}
              />
            </div>
          </div>
          
          {/* Heading pill */}
          <div className={styles.heading}>
            <p>{heading}</p>
            {headingIcons.map((icon, i) => (
              <div key={i} className={styles.headingIcon}>
                {icon}
              </div>
            ))}
          </div>

          {/* Subheading pill */}
          <div className={styles.subheading}>
            <p>{subheading}</p>
            {subheadingIcon && (
              <div className={styles.subheadingIcon}>
                {subheadingIcon}
              </div>
            )}
          </div>
        </div>

        {/* Details section */}
        <div className={styles.detailsSection}>
          {detailText.map((text, i) => (
            <div key={i} className={styles.detailText}>
              <p>{text}</p>
            </div>
          ))}

          {centerIllustration && (
            <div className={styles.centerIllustration}>
              <img
                src={centerIllustration.src}
                alt={centerIllustration.alt}
              />
            </div>
          )}
        </div>

        {/* Control panel */}
        <div className={styles.controlPanel}>
          {primaryAction}
        </div>
      </div>
    </div>
  );
};

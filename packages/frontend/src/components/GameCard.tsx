import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
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
  /** Optional content to show on the back of a flip card */
  heroImageBackside?: React.ReactNode;
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
  heroImageBackside,
  children,
  primaryAction,
  className = '',
}) => {
  // Flip card state - only used if heroImageBackside is provided
  const [isHovering, setIsHovering] = useState(false);
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Card is flipped based on hover, but manual override takes precedence
  const isFlipped = manualOverride !== null ? manualOverride : isHovering;

  const handleCardClick = () => {
    // Don't allow clicks during transition
    if (isHovering && !isTransitioning) {
      setManualOverride((prev) => {
        if (prev === null) {
          // First click while hovering - flip to front
          return false;
        }
          // Toggle between front and back
          return !prev;
      });

      // Set transitioning flag to prevent rapid clicks
      setIsTransitioning(true);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 600); // Match the CSS transition duration
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    // Set transitioning flag when hover starts
    setIsTransitioning(true);
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // Match the CSS transition duration
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Reset the manual override when mouse leaves
    setManualOverride(null);
    setIsTransitioning(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);
  return (
    <div className={`${styles.card} ${className}`} data-variant={variant}>
      {/* Border wrapper */}
      <div className={styles.border} />

      {/* This background border prevents scrolled content from peaking from behind the header */}
      <div className={styles.background} />

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
          {/* Hero image - with optional flip card */}
          <LazyMotion features={domAnimation}>
            {heroImageBackside ? (
              <div
                className={styles.flipCardContainer}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleCardClick}
              >
                <div className={`${styles.flipCard} ${isFlipped ? styles.flipped : ''}`}>
                  <div className={styles.flipCardFront}>
                    <div className={styles.imageWrapper}>
                      <AnimatePresence>
                        <m.img
                          key={heroImage}
                          src={heroImage}
                          alt={heroImageAlt}
                          className={styles.heroImage}
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -50, opacity: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className={styles.flipCardBack}>{heroImageBackside}</div>
                </div>
              </div>
            ) : (
              <div className={styles.imageWrapper}>
                <AnimatePresence>
                  <m.img
                    key={heroImage}
                    src={heroImage}
                    alt={heroImageAlt}
                    className={styles.heroImage}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                </AnimatePresence>
              </div>
            )}
          </LazyMotion>

          <div className={styles.subheadingContainer}>
            {/* Subheading pill - contained within image */}
            <div className={styles.subheading}>
              <p>{subheading}</p>
              {subheadingIcon && <div className={styles.subheadingIcon}>{subheadingIcon}</div>}
            </div>
          </div>
        </div>

        {/* Details section */}
        <div className={styles.detailsSection}>{children}</div>
      </div>
      {/* Control panel */}
      <div className={styles.controlPanel}>{primaryAction}</div>
    </div>
  );
};

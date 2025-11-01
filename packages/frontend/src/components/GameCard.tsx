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
  /** Key to track when content changes for flip hint (e.g., class name) */
  hintKey?: string;
  /** Timestamp for last interaction to reset hint timer */
  lastInteractionTime?: number;
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
  hintKey,
  lastInteractionTime,
}) => {
  // Flip card state - only used if heroImageBackside is provided
  const [isHovering, setIsHovering] = useState(false);
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hintRotation, setHintRotation] = useState(0);
  const [showHintGlow, setShowHintGlow] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Function to show the hint animation
  const showHintAnimation = () => {
    // Timer has fired, clear the ref so we know it's no longer active
    hintTimeoutRef.current = null;

    // Trigger the hint animation by rotating to 35deg with glow
    setHintRotation(35);
    setShowHintGlow(true);

    // Return to 0 after a brief moment (spring will handle the animation)
    setTimeout(() => {
      setHintRotation(0);
      // Keep glow visible during spring animation back to 0
      setTimeout(() => {
        setShowHintGlow(false);
      }, 200); // Short delay for spring
    }, 300);
  };

  // Set up hint timer when class (hintKey) changes
  useEffect(() => {
    // Clear any existing timeout
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }

    // Reset visuals
    setHintRotation(0);
    setShowHintGlow(false);

    // Only set up new timer if we have a flip backside and hintKey
    if (!heroImageBackside || !hintKey) return;

    // Set new timeout to show hint after 1s
    hintTimeoutRef.current = setTimeout(showHintAnimation, 1000);

    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintKey]); // Only trigger on hintKey change

  // Bump the timer when interaction happens (but only if timer exists)
  useEffect(() => {
    // Only bump if we have an active timeout
    if (lastInteractionTime && hintTimeoutRef.current) {
      // Clear existing timeout
      clearTimeout(hintTimeoutRef.current);

      // Reset visuals immediately
      setHintRotation(0);
      setShowHintGlow(false);

      // Restart the timer (bump it out by 1 second)
      if (heroImageBackside && hintKey) {
        hintTimeoutRef.current = setTimeout(showHintAnimation, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastInteractionTime]); // Only trigger on interaction

  // Turn off hint glow and reset rotation when card flips
  useEffect(() => {
    if (isFlipped) {
      setShowHintGlow(false);
      setHintRotation(0);
      // Clear any pending hint animations
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
    }
  }, [isFlipped]);

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
                {/* Glow background element */}
                <div className={`${styles.glowBackground} ${showHintGlow ? styles.glowActive : ''}`} />
                <m.div
                  className={styles.flipCard}
                  animate={{
                    rotateY: isFlipped ? 180 : hintRotation,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 25,
                    mass: 0.8,
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className={styles.flipCardFront}>
                    <div className={styles.imageWrapper}>
                      <AnimatePresence>
                        <m.img
                          key={heroImage}
                          src={heroImage}
                          alt={heroImageAlt}
                          className={styles.heroImage}
                          initial={variant === 'connect' ? false : { x: 50, opacity: 0 }}
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
                </m.div>
              </div>
            ) : (
              <div className={styles.imageWrapper}>
                <AnimatePresence>
                  <m.img
                    key={heroImage}
                    src={heroImage}
                    alt={heroImageAlt}
                    className={styles.heroImage}
                    initial={variant === 'connect' ? false : { x: 50, opacity: 0 }}
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

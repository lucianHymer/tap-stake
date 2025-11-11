import type React from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  AnimatePresence,
} from "framer-motion";
import {
  WandIcon,
  SpellIcon,
  PlantIcon,
  HammerIcon,
  MagnifyingGlassIcon,
  WizardWandIcon,
} from "../utils/classHelpers";
import type { ClassName } from "../utils/classHelpers";
import styles from "./ClassSubheading.module.css";

interface ClassSubheadingProps {
  className: ClassName;
}

export const ClassSubheading: React.FC<ClassSubheadingProps> = ({ className }) => {
  // Map of class names to their icons
  const classIcons = [
    { name: "Artificer", icon: <WandIcon /> },
    { name: "Bard", icon: <SpellIcon /> },
    { name: "Monk", icon: <PlantIcon /> },
    { name: "Paladin", icon: <HammerIcon /> },
    { name: "Seer", icon: <MagnifyingGlassIcon /> },
    { name: "Wizard", icon: <WizardWandIcon /> },
  ];

  // Split icons into left and right groups
  const leftIcons = classIcons.slice(0, 3);
  const rightIcons = classIcons.slice(3, 6);

  // Display "Undecided" for the "Decide" state
  const displayName = className === "Decide" ? "Undecided" : className;

  return (
    <LazyMotion features={domAnimation}>
      <div className={styles.container}>
        {/* Left group of icons */}
        <div className={styles.iconGroup}>
          {leftIcons.map((item) => {
            const isActive = className === item.name;
            return (
              <m.div
                key={item.name}
                className={`${styles.icon} ${isActive ? styles.active : ""}`}
                animate={{
                  opacity: isActive ? 1 : 0.4,
                  rotate: isActive ? [0, -5, 5, 0] : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5,
                  rotate: {
                    duration: 0.4,
                    ease: "easeInOut",
                  }
                }}
                whileHover={!isActive ? {
                  opacity: 0.7,
                  rotate: [-2, 2, -2, 2, 0],
                  transition: {
                    duration: 0.3,
                    rotate: {
                      duration: 0.4,
                      ease: "easeInOut"
                    }
                  }
                } : {}}
              >
                {item.icon}
              </m.div>
            );
          })}
        </div>

        {/* Class name in center with fade transition */}
        <AnimatePresence mode="wait">
          <m.p
            key={displayName}
            className={styles.className}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {displayName}
          </m.p>
        </AnimatePresence>

        {/* Right group of icons */}
        <div className={styles.iconGroup}>
          {rightIcons.map((item) => {
            const isActive = className === item.name;
            return (
              <m.div
                key={item.name}
                className={`${styles.icon} ${isActive ? styles.active : ""}`}
                animate={{
                  opacity: isActive ? 1 : 0.4,
                  rotate: isActive ? [0, -5, 5, 0] : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5,
                  rotate: {
                    duration: 0.4,
                    ease: "easeInOut",
                  }
                }}
                whileHover={!isActive ? {
                  opacity: 0.7,
                  rotate: [-2, 2, -2, 2, 0],
                  transition: {
                    duration: 0.3,
                    rotate: {
                      duration: 0.4,
                      ease: "easeInOut"
                    }
                  }
                } : {}}
              >
                {item.icon}
              </m.div>
            );
          })}
        </div>
      </div>
    </LazyMotion>
  );
};
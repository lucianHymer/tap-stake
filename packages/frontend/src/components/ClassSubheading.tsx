import type React from "react";
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
    <div className={styles.container}>
      {/* Left group of icons */}
      <div className={styles.iconGroup}>
        {leftIcons.map((item) => (
          <div
            key={item.name}
            className={`${styles.icon} ${
              className === item.name ? styles.active : ""
            }`}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* Class name in center */}
      <p className={styles.className}>{displayName}</p>

      {/* Right group of icons */}
      <div className={styles.iconGroup}>
        {rightIcons.map((item) => (
          <div
            key={item.name}
            className={`${styles.icon} ${
              className === item.name ? styles.active : ""
            }`}
          >
            {item.icon}
          </div>
        ))}
      </div>
    </div>
  );
};
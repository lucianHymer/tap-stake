import {
  type HTMLMotionProps,
  LazyMotion,
  domAnimation,
  m,
} from "framer-motion";
import type React from "react";
import styles from "./Button.module.css";

export interface ButtonProps
  extends Omit<
    HTMLMotionProps<"button">,
    "children" | "variant" | "leftIcon" | "rightIcon"
  > {
  variant?: "primary" | "outline" | "cancel";
  children: React.ReactNode;
  leftIcon?: string;
  rightIcon?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  leftIcon,
  rightIcon,
  className,
  ref,
  ...props
}) => {
  return (
    <LazyMotion features={domAnimation}>
      <m.button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${className || ""}`}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      >
        {leftIcon && <img src={leftIcon} alt="" className={styles.icon} />}
        {children}
        {rightIcon && <img src={rightIcon} alt="" className={styles.icon} />}
      </m.button>
    </LazyMotion>
  );
};

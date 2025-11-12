import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ASSETS } from "../config/assets";
import {
  CHOICES,
  SwordIcon,
  calculateClass,
  getClassImages,
} from "../utils/classHelpers";
import { Button } from "./Button";
import { ChoiceToggle } from "./ChoiceToggle";
import styles from "./ChoicesCard.module.css";
import { GameCard } from "./GameCard";
import { StatsDisplay } from "./StatsDisplay";
import { ClassSubheading } from "./ClassSubheading";

export interface ChoicesCardProps {
  /** Callback when Slay Moloch button is clicked */
  onSlayMoloch?: () => void;
  /** Callback when Run Away button is clicked */
  onRunAway?: () => void;
  /** Selected choices from AppContext */
  selectedChoices: Set<string>;
  /** Toggle callback from AppContext */
  onToggleChoice: (choiceId: string) => void;
  /** Total amount to distribute (from derived state) */
  totalAmount: number;
  /** Transaction status for showing simple status in grid */
  transactionStatus?: "idle" | "processing" | "signing" | "submitting" | "success" | "error";
  /** Transaction error message */
  transactionError?: string | null;
}

export const ChoicesCard: React.FC<ChoicesCardProps> = ({
  onSlayMoloch,
  onRunAway,
  selectedChoices,
  onToggleChoice,
  totalAmount,
  transactionStatus = "idle",
  transactionError,
}) => {

  // Calculate amount per choice (evenly distributed)
  // Returns the exact amount (not truncated) for backend use
  const getAmountPerChoice = useCallback(
    (choiceId: string): number => {
      if (!selectedChoices.has(choiceId)) return 0;
      const selectedCount = selectedChoices.size;
      if (selectedCount === 0) return 0;
      return totalAmount / selectedCount;
    },
    [selectedChoices, totalAmount],
  );

  // Get display amount (truncated to whole number)
  const getDisplayAmount = useCallback(
    (choiceId: string): number => {
      return Math.floor(getAmountPerChoice(choiceId));
    },
    [getAmountPerChoice],
  );

  // Selected choices with full details (stats, name, exact amount) - derived state
  const selectedChoicesWithDetails = useMemo(() => {
    return CHOICES.filter((choice) => selectedChoices.has(choice.id)).map(
      (choice) => ({
        id: choice.id,
        name: choice.name,
        stats: choice.stats,
        amount: getAmountPerChoice(choice.id), // Exact amount for backend
      }),
    );
  }, [selectedChoices, getAmountPerChoice]);

  // Calculate class and stats using shared helper
  const {
    className: selectedClass,
    stats: accumulatedStats,
    primaryStats,
  } = useMemo(() => calculateClass(selectedChoices), [selectedChoices]);

  // Log selected choices with details whenever selection changes
  useEffect(() => {
    console.log("Selected choices updated:", {
      selectedIds: Array.from(selectedChoices),
      selectedCount: selectedChoices.size,
      totalAmount,
      amountPerChoice:
        selectedChoices.size > 0 ? totalAmount / selectedChoices.size : 0,
      choices: selectedChoicesWithDetails,
      accumulatedStats,
      selectedClass,
    });
  }, [
    selectedChoices,
    totalAmount,
    selectedChoicesWithDetails,
    accumulatedStats,
    selectedClass,
  ]);

  const handleSlayMoloch = () => {
    console.log(
      "Slay Moloch clicked with choices:",
      selectedChoicesWithDetails,
    );
    console.log("Summary:", {
      totalAmount,
      selectedCount: selectedChoices.size,
      amountPerChoice:
        selectedChoices.size > 0 ? totalAmount / selectedChoices.size : 0,
      choices: selectedChoicesWithDetails.map((c) => ({
        name: c.name,
        stats: c.stats,
        amount: c.amount,
        displayAmount: Math.floor(c.amount),
      })),
    });
    onSlayMoloch?.();
  };

  const handleRunAway = () => {
    console.log("Run Away clicked");
    onRunAway?.();
  };

  const classImages = useMemo(
    () => getClassImages(selectedClass),
    [selectedClass],
  );

  // Track last interaction time to reset hint timer
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());

  // Update interaction time whenever choices change
  useEffect(() => {
    setLastInteractionTime(Date.now());
  }, [selectedChoices]);

  // Remove auto-focus on mount/navigation while keeping keyboard navigation working
  // Use layout effect to run synchronously before paint
  useLayoutEffect(() => {
    // Blur whatever element has focus when page loads/navigates here
    const blurInitialFocus = () => {
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
      ) {
        document.activeElement.blur();
      }
    };

    blurInitialFocus();
    // Also check after a tiny delay in case focus happens asynchronously
    const timeout = setTimeout(blurInitialFocus, 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <GameCard
      variant="default"
      heading="Choose your weapons..."
      headingIcons={[<SwordIcon key="sword" />]}
      subheading={<ClassSubheading className={selectedClass} />}
      heroImage={classImages.choice}
      heroImageAlt={`${selectedClass} choosing weapons`}
      hintKey={selectedClass}
      lastInteractionTime={lastInteractionTime}
      heroImageBackside={
        <StatsDisplay
          stats={accumulatedStats}
          characterClass={selectedClass}
          primaryStats={primaryStats}
        />
      }
      primaryAction={
        <div className={styles.controlPanel}>
          <Button
            variant="primary"
            onClick={handleSlayMoloch}
            disabled={selectedChoices.size === 0 || transactionStatus === "processing" || transactionStatus === "signing" || transactionStatus === "submitting"}
          >
            Slay Moloch.
          </Button>
          <Button
            variant="cancel"
            leftIcon={ASSETS.xIcon}
            rightIcon={ASSETS.xIcon}
            onClick={handleRunAway}
            disabled={transactionStatus === "processing" || transactionStatus === "signing" || transactionStatus === "submitting"}
          >
            Run Away
          </Button>
        </div>
      }
    >
      {transactionStatus !== "idle" ? (
        <div className={styles.transactionStatus}>
          {transactionStatus === "processing" && (
            <p className={styles.statusText}>Preparing...</p>
          )}
          {transactionStatus === "signing" && (
            <p className={styles.statusText}>Tap your card when prompted...</p>
          )}
          {transactionStatus === "submitting" && (
            <p className={styles.statusText}>Submitting transaction...</p>
          )}
          {transactionStatus === "success" && (
            <p className={styles.statusText}>Success!</p>
          )}
          {transactionStatus === "error" && (
            <p className={styles.errorText}>
              {transactionError || "Transaction failed"}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.choicesGrid}>
          {CHOICES.map((choice) => (
            <ChoiceToggle
              key={choice.id}
              name={choice.name}
              stats={choice.stats}
              amount={getDisplayAmount(choice.id)}
              active={selectedChoices.has(choice.id)}
              onClick={() => onToggleChoice(choice.id)}
              animationStyle="pulse"
            />
          ))}
        </div>
      )}
    </GameCard>
  );
};

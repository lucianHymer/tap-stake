import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../components/PageWrapper";
import { SlainCard } from "../components/SlainCard";
import { StatsDisplay } from "../components/StatsDisplay";
import { useAppContext } from "../contexts/AppContext";
import { CHOICE_DISPLAY_NAMES, calculateClass } from "../utils/classHelpers";

export function SlainPage() {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();

  // Calculate class, stats, and primary stats from existing stakes
  const {
    className: selectedClass,
    stats,
    primaryStats,
  } = useMemo(() => {
    return calculateClass(state.balances.existingStakes);
  }, [state.balances.existingStakes]);

  const handleStartOver = () => {
    console.log("🔄 Starting over with existing choices");
    // Pre-select current choices for next round
    actions.setSelectedChoices(new Set(state.balances.existingStakes.keys()));
    navigate("/choices");
  };

  // If no stakes exist, redirect to choices (in useEffect to avoid React Router warning)
  useEffect(() => {
    if (state.balances.existingStakes.size === 0) {
      console.log("⚠️ No stakes found, redirecting to choices");
      navigate("/choices");
    }
  }, [state.balances.existingStakes.size, navigate]);

  return (
    <PageWrapper>
      <SlainCard
        characterClass={selectedClass}
        stakes={state.balances.existingStakes}
        choiceNames={CHOICE_DISPLAY_NAMES}
        connectedAddress={state.connection.connectedAddress || undefined}
        onStartOver={handleStartOver}
        heroImageBackside={
          <StatsDisplay
            stats={stats}
            characterClass={selectedClass}
            primaryStats={primaryStats}
          />
        }
      />
    </PageWrapper>
  );
}

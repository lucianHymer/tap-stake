import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import { Button } from '../components/Button';
import { GameCard } from '../components/GameCard';
import { ASSETS } from '../config/assets';
import { useAppContext } from '../contexts/AppContext';
import styles from './SlainPage.module.css';

// Icon component
const SwordIcon = () => (
  <img src={ASSETS.swordIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

// Map choice IDs to display names
const CHOICE_DISPLAY_NAMES: Record<string, string> = {
  giveth: 'Giveth',
  karma: 'Karma',
  gardens: 'Gardens',
  deepfunding: 'Deep Funding',
  privote: 'Privote',
  silvi: 'Silvi',
};

export function SlainPage() {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();

  // Calculate total staked
  const totalStaked = Array.from(state.balances.existingStakes.values()).reduce(
    (sum, amount) => sum + amount,
    0n
  );

  const handleShareTwitter = () => {
    // TODO: Implement Twitter sharing
    console.log('📱 Share to Twitter');
    const text = encodeURIComponent(
      `I just staked ${formatEther(totalStaked)} GTC to slay Moloch! Join the fight for coordination at [URL]`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleStartOver = () => {
    console.log('🔄 Starting over with existing choices');
    // Pre-select current choices for next round
    actions.setSelectedChoices(new Set(state.balances.existingStakes.keys()));
    navigate('/choices');
  };

  // If no stakes exist, redirect to choices
  if (state.balances.existingStakes.size === 0) {
    console.log('⚠️ No stakes found, redirecting to choices');
    navigate('/choices');
    return null;
  }

  return (
    <div className={styles.slainPage}>
      <GameCard
        variant="default"
        heading="Moloch is Slain!"
        headingIcons={[<SwordIcon key="sword" />]}
        subheading="Victory"
        heroImage={ASSETS.heroSlain}
        heroImageAlt="Moloch defeated"
        primaryAction={
          <div className={styles.controlPanel}>
            <Button variant="outline" onClick={handleShareTwitter}>
              Share to Twitter
            </Button>
            <Button
              variant="cancel"
              leftIcon={ASSETS.xIcon}
              rightIcon={ASSETS.xIcon}
              onClick={handleStartOver}
            >
              Start Over
            </Button>
          </div>
        }
      >
        <div className={styles.detailsContent}>
          <h2 className={styles.victoryHeading}>
            You staked {formatEther(totalStaked)} GTC on {state.balances.existingStakes.size}{' '}
            {state.balances.existingStakes.size === 1 ? 'choice' : 'choices'}
          </h2>

          <ul className={styles.stakeList}>
            {Array.from(state.balances.existingStakes.entries()).map(([choiceId, amount]) => (
              <li key={choiceId} className={styles.stakeItem}>
                <span className={styles.choiceName}>
                  {CHOICE_DISPLAY_NAMES[choiceId] || choiceId}
                </span>
                <span className={styles.amount}>{formatEther(amount)} GTC</span>
              </li>
            ))}
          </ul>

          <p className={styles.bodyText}>
            Your stake has been recorded on the blockchain. The forces of coordination grow stronger
            with each slayer who joins the fight.
          </p>
        </div>
      </GameCard>
    </div>
  );
}

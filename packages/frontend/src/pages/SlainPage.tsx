import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import { Button } from '../components/Button';
import { GameCard } from '../components/GameCard';
import { PageWrapper } from '../components/PageWrapper';
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

  // Format total - rounded up to nearest whole number
  const totalFormatted = Math.ceil(Number(formatEther(totalStaked)));

  // Format individual amounts - truncated to 1 decimal
  const formatStakeAmount = (amount: bigint): string => {
    const fullAmount = Number(formatEther(amount));
    return Math.floor(fullAmount * 10) / 10 + '';
  };

  const handleShareTwitter = () => {
    // TODO: Implement Twitter sharing
    console.log('📱 Share to Twitter');
    const text = encodeURIComponent(
      `I just staked ${totalFormatted} GTC to slay Moloch! Join the fight for coordination at [URL]`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleStartOver = () => {
    console.log('🔄 Starting over with existing choices');
    // Pre-select current choices for next round
    actions.setSelectedChoices(new Set(state.balances.existingStakes.keys()));
    navigate('/choices');
  };

  // If no stakes exist, redirect to choices (in useEffect to avoid React Router warning)
  useEffect(() => {
    if (state.balances.existingStakes.size === 0) {
      console.log('⚠️ No stakes found, redirecting to choices');
      navigate('/choices');
    }
  }, [state.balances.existingStakes.size, navigate]);

  return (
    <PageWrapper>
      <GameCard
        variant="default"
        heading="Moloch is Slain!"
        headingIcons={[<SwordIcon key="sword" />]}
        subheading={`${totalFormatted} GTC Staked`}
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
          <ul className={styles.stakeList}>
            {Array.from(state.balances.existingStakes.entries()).map(([choiceId, amount]) => (
              <li key={choiceId} className={styles.stakeItem}>
                <span className={styles.choiceName}>
                  {CHOICE_DISPLAY_NAMES[choiceId] || choiceId}
                </span>
                <span className={styles.amount}>{formatStakeAmount(amount)} GTC</span>
              </li>
            ))}
          </ul>

          <p className={styles.bodyText}>
            {state.transaction.txHash ? (
              <>
                Your stake has been{' '}
                <a
                  href={`https://sepolia-optimism.etherscan.io/tx/${state.transaction.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.blockchainLink}
                >
                  recorded on the blockchain
                </a>
                . The forces of coordination grow stronger with each slayer who joins the fight.
              </>
            ) : (
              <>
                Your stake has been recorded on the blockchain. The forces of coordination grow
                stronger with each slayer who joins the fight.
              </>
            )}
          </p>
        </div>
      </GameCard>
    </PageWrapper>
  );
}

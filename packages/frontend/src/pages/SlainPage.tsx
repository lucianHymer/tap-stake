import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import { optimism, optimismSepolia } from 'viem/chains';
import { Button } from '../components/Button';
import { GameCard } from '../components/GameCard';
import { PageWrapper } from '../components/PageWrapper';
import { ASSETS } from '../config/assets';
import { useAppContext } from '../contexts/AppContext';
import styles from './SlainPage.module.css';

// Icon components
const SwordIcon = () => (
  <img src={ASSETS.swordIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

const WandIcon = () => (
  <img src={ASSETS.wandIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

const WizardWandIcon = () => (
  <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5996 13.3977H15.3996V16.1977H12.5996V13.3977Z" fill="white" />
    <path d="M15.4004 10.5977H18.2004V13.3977H15.4004V10.5977Z" fill="white" />
    <path d="M12.5996 7.79761H15.3996V10.5976H12.5996V7.79761Z" fill="white" />
    <path d="M18.2002 13.3977H21.0002V16.1977H18.2002V13.3977Z" fill="white" />
    <path d="M7 18.9976H9.8V21.7976H7V18.9976Z" fill="white" />
    <path d="M4.2002 21.7976H7.0002V24.5976H4.2002V21.7976Z" fill="white" />
    <path d="M1.40039 24.5979H4.20039V27.3979H1.40039V24.5979Z" fill="white" />
    <path d="M9.7998 16.1975H12.5998V18.9975H9.7998V16.1975Z" fill="white" />
    <path
      d="M18.202 2.19775L18.2002 10.5978H26.6002V2.19775H18.202ZM23.8002 7.79775H21.0002V4.99775H23.8002V7.79775Z"
      fill="white"
    />
  </svg>
);

const HammerIcon = () => (
  <svg width="28" height="30" viewBox="0 0 28 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_46_1822)">
      <path
        d="M15.0763 3.02952H12.9238V9.72103H15.0763V7.48938H17.2288V5.25774H19.3813V3.02609H21.5338V0.797852H15.0742V3.0295L15.0763 3.02952Z"
        fill="white"
      />
      <path d="M25.842 3.02954H23.6895V5.26119H25.842V3.02954Z" fill="white" />
      <path
        d="M17.2314 7.48946V11.9516H21.5388V9.71995H23.6913V5.25781H19.3839V7.48946H17.2314Z"
        fill="white"
      />
      <path
        d="M21.5363 11.9516V14.1832H19.3838V16.4149H25.8434V14.1832H27.9959V7.4917H25.8434V9.72335H23.6909V11.955H21.5384L21.5363 11.9516Z"
        fill="white"
      />
      <path d="M15.0762 14.1831H17.2287V11.9514H15.0762V14.1831Z" fill="white" />
      <path d="M12.9238 16.4148H15.0763V14.1831H12.9238V16.4148Z" fill="white" />
      <path d="M10.7715 18.6442H12.924V16.4126H10.7715V18.6442Z" fill="white" />
      <path d="M8.61621 20.8745H10.7687V18.6428H8.61621V20.8745Z" fill="white" />
      <path
        d="M4.3119 23.1065H6.4644V25.3381H8.6169V20.876H4.30957V23.1076L4.3119 23.1065Z"
        fill="white"
      />
      <path d="M4.31168 23.1064H2.15918V25.3381H4.31168V23.1064Z" fill="white" />
      <path
        d="M2.15836 25.3366H0.00585938V29.7987H4.31319V27.5671H2.16069V25.3354L2.15836 25.3366Z"
        fill="white"
      />
      <path d="M4.31152 27.5673H6.46402V25.3357H4.31152V27.5673Z" fill="white" />
    </g>
    <defs>
      <clipPath id="clip0_46_1822">
        <rect width="28" height="29" fill="white" transform="translate(0 0.797852)" />
      </clipPath>
    </defs>
  </svg>
);

const SpellIcon = () => (
  <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15.8281 18.8479H18.6281V16.0479H21.4281V18.8479H24.2281V16.0479H27.0281V13.2479H24.2281V10.4479H21.4281V13.2479H18.6281V10.4479H15.8281V7.64785H18.6281V4.84785H15.8281V2.04785H13.0281V4.84785H10.2281V7.64785H13.0281V10.4479H10.2281V13.2479H7.42813V10.4479H4.62813V13.2479H1.82812V16.0479H4.62813V18.8479H7.42813V16.0479H10.2281V18.8479H13.0281V21.6479H10.2281V24.4479H13.0281V27.2479H15.8281V24.4479H18.6281V21.6479H15.8281V18.8479ZM13.0281 16.0479V13.2479H15.8281V16.0479H13.0281Z"
      fill="white"
    />
    <path d="M4.62793 21.6479H7.42793V24.4479H4.62793V21.6479Z" fill="white" />
    <path d="M7.42773 18.8479H10.2277V21.6479H7.42773V18.8479Z" fill="white" />
    <path d="M10.2277 10.4479V7.64795H7.42773V10.4479H10.2277Z" fill="white" />
    <path d="M4.62793 4.8479H7.42793V7.6479H4.62793V4.8479Z" fill="white" />
    <path d="M21.4277 21.6479H24.2277V24.4479H21.4277V21.6479Z" fill="white" />
    <path d="M21.4279 18.8479H18.6279V21.6479H21.4279V18.8479Z" fill="white" />
    <path d="M18.6279 7.64795H21.4279V10.4479H18.6279V7.64795Z" fill="white" />
    <path d="M21.4277 4.8479H24.2277V7.6479H21.4277V4.8479Z" fill="white" />
  </svg>
);

const PlantIcon = () => (
  <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.6357 21.8013H15.4357V27.4013H12.6357V21.8013Z" fill="white" />
    <path d="M12.6357 10.6013H15.4357V16.2013H12.6357V10.6013Z" fill="white" />
    <path d="M18.2355 19.0017V16.2017H15.4355V21.8017H21.0355V19.0017H18.2355Z" fill="white" />
    <path
      d="M21.0354 13.4016H18.2354V16.2016H21.0354V19.0016H23.8354V13.4016H21.0354Z"
      fill="white"
    />
    <path
      d="M7.03535 13.4016H4.23535V19.0016H7.03535V16.2016H9.83535V13.4016H7.03535Z"
      fill="white"
    />
    <path d="M9.83516 16.2017V19.0017H7.03516V21.8017H12.6352V16.2017H9.83516Z" fill="white" />
    <path d="M18.2355 7.80147V5.00146H15.4355V10.6015H21.0355V7.80147H18.2355Z" fill="white" />
    <path
      d="M21.0354 2.20142H18.2354V5.00142H21.0354V7.80142H23.8354V2.20142H21.0354Z"
      fill="white"
    />
    <path
      d="M7.03535 2.20142H4.23535V7.80142H7.03535V5.00142H9.83535V2.20142H7.03535Z"
      fill="white"
    />
    <path d="M9.83516 5.00146V7.80147H7.03516V10.6015H12.6352V5.00146H9.83516Z" fill="white" />
  </svg>
);

const MagnifyingGlassIcon = () => (
  <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.02832 2.20142H15.4323V5.00142H7.02832V2.20142Z" fill="white" />
    <path d="M7.03223 19.0068H15.4362V21.8068H7.03223V19.0068Z" fill="white" />
    <path d="M4.22803 5.00146H7.02803V7.80146H4.22803V5.00146Z" fill="white" />
    <path d="M4.23242 16.2068H7.03242V19.0068H4.23242V16.2068Z" fill="white" />
    <path d="M21.0283 21.8013H23.8283V24.6013H21.0283V21.8013Z" fill="white" />
    <path d="M18.2324 19.0068H21.0324V21.8068H18.2324V19.0068Z" fill="white" />
    <path d="M23.8325 24.6072H26.6325V27.4072H23.8325V24.6072Z" fill="white" />
    <path d="M15.4326 5.00684H18.2326V7.80684H15.4326V5.00684Z" fill="white" />
    <path d="M15.4326 16.2068H18.2326V19.0068H15.4326V16.2068Z" fill="white" />
    <path
      d="M4.22801 7.80127H1.42801C1.43065 10.6045 1.42537 13.4034 1.42801 16.2066H4.22801C4.22537 13.4034 4.23065 10.6045 4.22801 7.80127Z"
      fill="white"
    />
    <path
      d="M21.0332 7.80127H18.2332C18.2358 10.6045 18.2305 13.4034 18.2332 16.2066H21.0332C21.0305 13.4034 21.0358 10.6045 21.0332 7.80127Z"
      fill="white"
    />
    <path d="M12.6323 10.6066V7.80664H15.4323V10.6066H12.6323Z" fill="white" />
  </svg>
);

// Map choice IDs to display names
const CHOICE_DISPLAY_NAMES: Record<string, string> = {
  giveth: 'Giveth',
  karma: 'Karma',
  gardens: 'Gardens',
  deepfunding: 'D. F.',
  privote: 'Privote',
  silvi: 'Silvi',
};

// Map choice IDs to their stats (same as in ChoicesCard)
const CHOICE_STATS: Record<string, { major: 'charisma' | 'intelligence' | 'wisdom'; minor: 'charisma' | 'intelligence' | 'wisdom' }> = {
  giveth: { major: 'charisma', minor: 'intelligence' },
  karma: { major: 'wisdom', minor: 'intelligence' },
  gardens: { major: 'charisma', minor: 'wisdom' },
  deepfunding: { major: 'intelligence', minor: 'wisdom' },
  privote: { major: 'intelligence', minor: 'wisdom' },
  silvi: { major: 'wisdom', minor: 'charisma' },
};

// Get icon for class
const getClassIcon = (className: string) => {
  switch (className) {
    case 'Wizard':
      return <WizardWandIcon />;
    case 'Paladin':
      return <HammerIcon />;
    case 'Bard':
      return <SpellIcon />;
    case 'Monk':
      return <PlantIcon />;
    case 'Seer':
      return <MagnifyingGlassIcon />;
    case 'Artificer':
      return <WandIcon />;
    default:
      return <WandIcon />;
  }
};

// Get block explorer URL for address based on chain
const getExplorerUrl = (address: string, chainId: number = optimismSepolia.id): string => {
  if (chainId === optimism.id) {
    return `https://optimistic.etherscan.io/address/${address}`;
  }
  // Default to OP Sepolia
  return `https://sepolia-optimism.etherscan.io/address/${address}`;
};

// Abbreviate address for display (0x1234...5678)
const abbreviateAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

  // Calculate which class the user chose based on staked choices
  const selectedClass = useMemo(() => {
    if (state.balances.existingStakes.size === 0) return 'Artificer';

    // Calculate accumulated stats from staked choices
    const stats = {
      charisma: 1,
      intelligence: 1,
      wisdom: 1,
    };

    for (const [choiceId] of state.balances.existingStakes.entries()) {
      const choiceStats = CHOICE_STATS[choiceId];
      if (choiceStats) {
        stats[choiceStats.major] += 2; // 2 points for major stat
        stats[choiceStats.minor] += 1; // 1 point for minor stat
      }
    }

    // Sort stats to find top 2
    const sortedStats = [
      { name: 'charisma' as const, value: stats.charisma },
      { name: 'intelligence' as const, value: stats.intelligence },
      { name: 'wisdom' as const, value: stats.wisdom },
    ].sort((a, b) => b.value - a.value);

    const [first, second] = sortedStats;

    // Map top 2 stats to class
    const statPair = `${first.name}/${second.name}`;

    const classMap: Record<string, string> = {
      'charisma/intelligence': 'Bard',
      'charisma/wisdom': 'Paladin',
      'intelligence/charisma': 'Artificer',
      'intelligence/wisdom': 'Wizard',
      'wisdom/charisma': 'Monk',
      'wisdom/intelligence': 'Seer',
    };

    return classMap[statPair] || 'Artificer';
  }, [state.balances.existingStakes]);

  // Format individual amounts - truncated to 1 decimal
  const formatStakeAmount = (amount: bigint): string => {
    const fullAmount = Number(formatEther(amount));
    return Math.floor(fullAmount * 10) / 10 + '';
  };

  const handleStartOver = () => {
    console.log('🔄 Starting over with existing choices');
    // Pre-select current choices for next round
    actions.setSelectedChoices(new Set(state.balances.existingStakes.keys()));
    navigate('/choices');
  };

  // Get whitepaper URL from env or use fallback
  const whitepaperUrl = import.meta.env.VITE_WHITEPAPER_URL || 'https://www.google.com';

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
        subheading={selectedClass}
        subheadingIcon={getClassIcon(selectedClass)}
        heroImage={ASSETS.classImages[selectedClass as keyof typeof ASSETS.classImages]?.slain || ASSETS.heroSlain}
        heroImageAlt="Moloch defeated"
        primaryAction={
          <div className={styles.controlPanel}>
            <a
              href={whitepaperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.whitepaperButton} ${styles.outlineButton}`}
            >
              View Whitepaper
            </a>
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
            Your stake has been recorded on the blockchain. The forces of coordination grow stronger.
          </p>

          {state.connection.connectedAddress && (
            <div className={styles.slayerAddress}>
              <span className={styles.slayerLabel}>Slayer:</span>{' '}
              <a
                href={getExplorerUrl(state.connection.connectedAddress, optimismSepolia.id)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.addressLink}
              >
                {abbreviateAddress(state.connection.connectedAddress)}
              </a>
            </div>
          )}
        </div>
      </GameCard>
    </PageWrapper>
  );
}

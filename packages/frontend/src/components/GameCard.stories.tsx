import type { Meta, StoryObj } from '@storybook/react';
import { GameCard } from './GameCard';
import { Button } from './Button';
import { ASSETS } from '../config/assets';

const meta = {
  title: 'Components/GameCard',
  component: GameCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#120117' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GameCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Icon components using img tags for easy CDN swapping
const HeartIcon = () => (
  <img src={ASSETS.heartIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

const HelmetIcon = () => (
  <img src={ASSETS.helmetIcon} alt="" style={{ width: '28px', height: '30px', display: 'block' }} />
);

// ConnectCard - matches Figma design exactly
export const Connect: Story = {
  args: {
    variant: 'connect',
    heading: 'Slayers of Moloch',
    headingIcons: [<HeartIcon key="1" />, <HeartIcon key="2" />],
    subheading: 'Connect',
    subheadingIcon: <HelmetIcon />,
    heroImage: ASSETS.heroMoloch,
    heroImageAlt: 'Hero battling Moloch',
    detailText: [
      'You have been given 100 GTC to allocate in the fight against Moloch.',
      'Tap your Burner card at the top of your phone when prompted.',
    ],
    centerIllustration: {
      src: ASSETS.nfcCard,
      alt: 'NFC card tap animation',
    },
    primaryAction: (
      <Button variant="primary">
        Connect
      </Button>
    ),
  },
};

// Playground for testing
export const Playground: Story = {
  args: {
    variant: 'default',
    heading: 'Test Heading',
    headingIcons: [<HeartIcon key="1" />],
    subheading: 'Test Subheading',
    subheadingIcon: <HelmetIcon />,
    heroImage: ASSETS.heroMoloch,
    heroImageAlt: 'Test image',
    detailText: [
      'First detail text paragraph.',
      'Second detail text paragraph.',
    ],
    primaryAction: (
      <Button variant="primary">
        Action
      </Button>
    ),
  },
};

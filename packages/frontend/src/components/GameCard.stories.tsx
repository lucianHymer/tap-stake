import type { Meta, StoryObj } from '@storybook/react';
import { GameCard } from './GameCard';
import { ConnectCard } from './ConnectCard';
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

// ConnectCard - now using the dedicated component
// Note: This is technically not a GameCard story since it uses ConnectCard,
// but kept here for convenience. Consider moving to ConnectCard.stories.tsx
export const Connect = () => <ConnectCard onConnect={() => console.log('Connect clicked')} />;

// Playground for testing with custom children
export const Playground: Story = {
  args: {
    variant: 'default',
    heading: 'Test Heading',
    headingIcons: [<HeartIcon key="1" />],
    subheading: 'Test Subheading',
    subheadingIcon: <HelmetIcon />,
    heroImage: ASSETS.heroMoloch,
    heroImageAlt: 'Test image',
    primaryAction: (
      <Button variant="primary">
        Action
      </Button>
    ),
    children: (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        <p>Custom content goes here!</p>
        <p>You can put anything you want in the details section.</p>
      </div>
    ),
  },
};

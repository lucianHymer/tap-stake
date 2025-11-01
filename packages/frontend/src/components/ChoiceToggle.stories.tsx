import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChoiceToggle, type StatName } from './ChoiceToggle';

const meta = {
  title: 'Components/ChoiceToggle',
  component: ChoiceToggle,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#12061F' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    active: {
      control: 'boolean',
      description: 'Whether the toggle is in active (selected) state',
    },
    name: {
      control: 'text',
      description: 'The main name/title displayed on the toggle',
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof ChoiceToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic inactive state
export const Inactive: Story = {
  args: {
    name: 'Giveth',
    stats: {
      major: 'charisma',
      minor: 'intelligence',
    },
    amount: 0,
    active: false,
    onClick: () => console.log('Toggle clicked'),
  },
};

// Basic active state
export const Active: Story = {
  args: {
    name: 'Giveth',
    stats: {
      major: 'charisma',
      minor: 'intelligence',
    },
    amount: 33,
    active: true,
    onClick: () => console.log('Toggle clicked'),
  },
};

// Different choice option
export const DifferentChoice: Story = {
  args: {
    name: 'Taketh',
    stats: {
      major: 'wisdom',
      minor: 'intelligence',
    },
    amount: 0,
    active: false,
    onClick: () => console.log('Toggle clicked'),
  },
};

// Interactive example with state management
export const Interactive = () => {
  const [activeChoice, setActiveChoice] = useState<'giveth' | 'taketh' | null>(null);
  const totalAmount = 100;
  const selectedCount = activeChoice ? 1 : 0;
  const amountPerChoice = selectedCount > 0 ? totalAmount / selectedCount : 0;

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <ChoiceToggle
        name="Giveth"
        stats={{
          major: 'charisma',
          minor: 'intelligence',
        }}
        amount={activeChoice === 'giveth' ? Math.floor(amountPerChoice) : 0}
        active={activeChoice === 'giveth'}
        onClick={() => setActiveChoice('giveth')}
      />
      <ChoiceToggle
        name="Taketh"
        stats={{
          major: 'wisdom',
          minor: 'intelligence',
        }}
        amount={activeChoice === 'taketh' ? Math.floor(amountPerChoice) : 0}
        active={activeChoice === 'taketh'}
        onClick={() => setActiveChoice('taketh')}
      />
    </div>
  );
};

Interactive.parameters = {
  docs: {
    description: {
      story:
        'Interactive example showing how to control toggle state from a parent component. Click either option to select it.',
    },
  },
};

// Multiple options example
export const MultipleOptions = () => {
  const [activeChoice, setActiveChoice] = useState<string | null>(null);
  const totalAmount = 100;
  const selectedCount = activeChoice ? 1 : 0;
  const amountPerChoice = selectedCount > 0 ? totalAmount / selectedCount : 0;

  const choices: Array<{ id: string; name: string; stats: { major: StatName; minor: StatName } }> =
    [
      { id: 'warrior', name: 'Warrior', stats: { major: 'wisdom', minor: 'intelligence' } },
      { id: 'mage', name: 'Mage', stats: { major: 'intelligence', minor: 'wisdom' } },
      { id: 'rogue', name: 'Rogue', stats: { major: 'charisma', minor: 'intelligence' } },
    ];

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {choices.map((choice) => (
        <ChoiceToggle
          key={choice.id}
          name={choice.name}
          stats={choice.stats}
          amount={activeChoice === choice.id ? Math.floor(amountPerChoice) : 0}
          active={activeChoice === choice.id}
          onClick={() => setActiveChoice(choice.id)}
        />
      ))}
    </div>
  );
};

MultipleOptions.parameters = {
  docs: {
    description: {
      story: 'Example with multiple choice options. Only one can be active at a time.',
    },
  },
};

// Playground for testing
export const Playground: Story = {
  args: {
    name: 'Custom',
    stats: {
      major: 'intelligence',
      minor: 'wisdom',
    },
    amount: 50,
    active: false,
    onClick: () => console.log('Clicked'),
  },
};

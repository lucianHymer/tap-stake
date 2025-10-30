import type { Preview } from '@storybook/react-vite'
import '../src/styles/moloch-tokens.css';
import '../src/index.css';

// Set theme on document root for design tokens
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'moloch');
}

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'moloch-dark',
      values: [
        {
          name: 'moloch-dark',
          value: '#12061f',
        },
      ],
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;
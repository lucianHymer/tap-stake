import type { Preview } from '@storybook/react-vite';
import { create } from 'storybook/theming';
import '../src/styles/moloch-tokens.css';
import '../src/index.css';

// Set theme on document root for design tokens
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'moloch');
}

// Create custom Moloch dark theme for Storybook UI
const molochTheme = create({
  base: 'dark',

  // Brand
  brandTitle: 'Moloch Design System',
  brandUrl: '/',

  // UI colors - match our dark purple theme
  colorPrimary: '#F50303', // accent red
  colorSecondary: '#39FF14', // neon green

  // UI background
  appBg: '#12061F', // main purple bg
  appContentBg: '#1A0C2A', // elevated purple bg
  appPreviewBg: '#12061F',
  appBorderColor: 'rgba(255,255,255,0.14)',
  appBorderRadius: 12,

  // Typography
  fontBase: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
  fontCode: 'monospace',

  // Text colors
  textColor: '#FFFFFF',
  textInverseColor: '#0D0E0D',
  textMutedColor: '#9E9E9E',

  // Toolbar colors
  barTextColor: '#FFFFFF',
  barSelectedColor: '#39FF14',
  barHoverColor: '#39FF14',
  barBg: '#1A0C2A',

  // Form colors
  inputBg: '#1A0C2A',
  inputBorder: 'rgba(255,255,255,0.14)',
  inputTextColor: '#FFFFFF',
  inputBorderRadius: 12,
});

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
    docs: {
      theme: molochTheme,
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;

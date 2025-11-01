#!/usr/bin/env node
import StyleDictionary from 'style-dictionary';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🎨 Building Moloch design tokens...\n');

// Register custom format to handle SVG paths properly
StyleDictionary.registerFormat({
  name: 'css/variables-quoted-assets',
  format: ({ dictionary, options = {} }) => {
    const { selector = ':root' } = options;

    // Helper to format token value - quote SVG paths for valid CSS
    const formatValue = (token) => {
      const value = token.value;
      // If it's an asset path (ends with .svg, .png, .jpg, etc), wrap in quotes
      if (typeof value === 'string' && /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(value)) {
        return `"${value}"`;
      }
      return value;
    };

    // Build CSS variables
    const variables = dictionary.allTokens
      .map(token => `  --${token.name}: ${formatValue(token)};`)
      .join('\n');

    return `${selector} {\n${variables}\n}\n`;
  }
});

// Configuration
const config = {
  source: [join(rootDir, 'design-system/Moloch_Stylekit_DarkGrim/moloch-design-tokens.json')],
  platforms: {
    // All tokens in one CSS file
    css: {
      transformGroup: 'css',
      transforms: ['attribute/cti', 'name/kebab', 'size/px', 'color/css'],
      buildPath: join(rootDir, 'src/styles/'),
      files: [
        {
          destination: 'moloch-tokens.css',
          format: 'css/variables-quoted-assets',
          options: {
            selector: ':root[data-theme="moloch"]'
          }
        }
      ]
    },
    // TypeScript constants for type-safe access
    typescript: {
      transformGroup: 'js',
      transforms: ['attribute/cti', 'name/pascal', 'size/px', 'color/hex'],
      buildPath: join(rootDir, 'src/styles/'),
      files: [
        {
          destination: 'moloch-tokens.ts',
          format: 'javascript/es6',
          options: {
            typescript: true
          }
        }
      ]
    }
  }
};

// Ensure output directory exists
const stylesDir = join(rootDir, 'src/styles');
if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
}

// Build all platforms
const sd = new StyleDictionary(config);

try {
  await sd.buildAllPlatforms();

  console.log('✅ Token build complete!\n');
  console.log('Generated files:');
  console.log('  📄 src/styles/moloch-tokens.css - All design tokens (core, semantic, component)');
  console.log('  📄 src/styles/moloch-tokens.ts - TypeScript constants');
  console.log('\nUsage in component CSS modules:');
  console.log('  @import "../styles/moloch-tokens.css";');
  console.log('  .button { background: var(--component-button-primary-bg-default); }');
  console.log('  .button:hover { background: var(--component-button-primary-bg-hover); }');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
# Moloch Design System - Pure Token Approach

## Architecture Philosophy
Simplified design token integration that keeps tokens pure and lets components own their implementation:
- Design tokens provide only values (no structural CSS)
- Component styles live with components (colocated .tsx + .module.css)
- Clear separation between design decisions (tokens) and implementation (components)

## Directory Structure
- **Token source**: `packages/frontend/design-system/Moloch_Stylekit_DarkGrim/moloch-design-tokens.json`
- **Build script**: `packages/frontend/scripts/build-tokens.mjs`
- **Generated tokens**: `packages/frontend/src/styles/`
  - `moloch-tokens.css` - Contains ALL tokens (core, semantic, AND component tokens)
  - `moloch-tokens.ts` - TypeScript constants

**IMPORTANT**: There is NO separate moloch-components.css file. All tokens are consolidated into moloch-tokens.css.

## Build Process
Run `npm run build:tokens` in frontend package

## Generated Output
Pure CSS variables only - no utility classes or structural CSS:
```css
:root {
  --component-button-primary-bg-default: #F50303;
  --component-button-primary-bg-hover: #D10404;
  --component-button-primary-bg-pressed: #B90303;
  /* etc */
}
```

## Usage Pattern in Components
Components import tokens and define their own structure:

```css
/* Button.module.css */
@import "../styles/moloch-tokens.css";

.button {
  /* Structure - owned by component */
  padding: 12px 24px;
  border: 1px solid transparent;
  cursor: pointer;

  /* Design tokens - from generated files */
  background: var(--component-button-primary-bg-default);
  color: var(--component-button-primary-text-default);
  border-radius: var(--component-button-primary-radius);
  transition: all var(--core-motion-fast) var(--core-motion-easing-in-out);
}

.button:hover {
  background: var(--component-button-primary-bg-hover);
}

.button:active {
  background: var(--component-button-primary-bg-pressed);
}
```

## Benefits
- Token updates flow through automatically
- Components can have different structures with same tokens
- Component logic stays with component code
- Generated files are predictable and pure
- No opinions about HTML structure in token layer

**Related files**: packages/frontend/scripts/build-tokens.mjs, packages/frontend/src/styles/moloch-tokens.css

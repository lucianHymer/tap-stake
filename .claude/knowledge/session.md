### [17:37] [frontend] Moloch design system token consolidation
**Details**: The build script (scripts/build-tokens.mjs) generates only ONE CSS file containing ALL design tokens, not separate files:

Generated files:
- moloch-tokens.css - Contains ALL tokens (core, semantic, AND component tokens)
- moloch-tokens.ts - TypeScript constants

There is NO separate moloch-components.css file anymore. The previous knowledge base entry was outdated.

When importing in CSS modules, only use:
@import "../styles/moloch-tokens.css";

Do NOT import moloch-components.css as it doesn't exist and will cause build failures.
**Files**: packages/frontend/scripts/build-tokens.mjs, packages/frontend/src/styles/moloch-tokens.css
---


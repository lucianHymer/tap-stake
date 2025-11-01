# Session Knowledge Capture

<!-- This file captures raw knowledge during the current session -->
<!-- It will be processed by Mím and cleared after coalescing -->

### [18:13] [pattern] Stats Display with Horizontal Bars
**Details**: Created StatsDisplay component for showing D&D/video-game style character stats with horizontal bar graph visualization.

Key features:
- Horizontal bars for charisma (green), intelligence (red), wisdom (purple)
- All stats have base value of 1 to prevent blank bars
- Animated using Framer Motion (duration-based animation with ease-out)
- Bars have glowing effects using Moloch design tokens
- Includes class description at top with highlighted class name
- Bar widths calculated as percentage of max stat value
- Stat values displayed in monospace font with text-shadow
- Hover effects intensify the glows

Pattern uses:
- LazyMotion for bundle size optimization
- useMotionValue + useTransform for animated widths
- Moloch design tokens (--core-color-neon-green, --core-color-accent-red, --core-color-accent-purple)
- Box-shadow for both inner depth and outer glow effects
- Separate bars for each stat with consistent height (25px)
**Files**: packages/frontend/src/components/StatsDisplay.tsx, packages/frontend/src/components/StatsDisplay.module.css
---


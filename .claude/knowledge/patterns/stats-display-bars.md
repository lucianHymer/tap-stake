# Stats Display with Horizontal Bars

## Overview
Created StatsDisplay component for showing D&D/video-game style character stats with horizontal bar graph visualization.

## Key Features
- Horizontal bars for charisma (green), intelligence (red), wisdom (purple)
- All stats have base value of 1 to prevent blank bars
- Animated using Framer Motion (duration-based animation with ease-out)
- Bars have glowing effects using Moloch design tokens
- Includes class description at top with highlighted class name
- Bar widths calculated as percentage of max stat value
- Stat values displayed in monospace font with text-shadow
- Hover effects intensify the glows

## Implementation Pattern

### Animation Strategy
Uses Framer Motion with:
- LazyMotion for bundle size optimization
- useMotionValue + useTransform for animated widths
- Duration-based animation with ease-out (vs springs used elsewhere for counters)

### Visual Styling
- Moloch design tokens for colors:
  - `--core-color-neon-green` (charisma)
  - `--core-color-accent-red` (intelligence)
  - `--core-color-accent-purple` (wisdom)
- Box-shadow for both inner depth and outer glow effects
- Separate bars for each stat with consistent height (25px)

### Base Value Pattern
All stats have base value of 1 to ensure bars are visible even at zero, preventing "blank" appearance that could confuse users.

**Related files**: packages/frontend/src/components/StatsDisplay.tsx, packages/frontend/src/components/StatsDisplay.module.css

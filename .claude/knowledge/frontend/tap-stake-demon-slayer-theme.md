# Tap-Stake Demon-Slayer Theme

## Overview
The Tap-Stake NFC wallet app features a fun, tongue-in-cheek demon-slayer themed frontend with a dark, dramatic aesthetic centered around defeating Moloch (the demon of dis-coordination).

## Visual Design
- **Typography**: Bold "TAP STAKE" title in Bebas Neue font with glowing red blood effect
- **Color Scheme**: Dark demonic aesthetic with black/red colors and blood-like gradients  
- **Hero Images**: Moloch statue images (moloch1.png and moloch2.png) that switch on click to show stake being hammered
- **Layout**: All content vertically and horizontally centered in viewport

## Interactive Elements
- **Two-step flow**:
  1. First tap reads NFC card
  2. Second tap signs message "I SLAY MOLOCH, DEMON OF DIS-COORDINATION!"
- **Victory state**: Displays "MOLOCH IS SLAIN! COORDINATION RESTORED!" when signature verified
- **Click interaction**: Clicking Moloch image switches between two states showing stake impact

## Technical Styling
- Technical information presented as "arcane knowledge":
  - Addresses shown as "SLAYER'S SIGIL"
  - Signatures shown as "BLOOD SEAL"
- Collapsible "ARCANE REQUIREMENTS" section for technical requirements
- Animated effects:
  - Pulsing text animations
  - Scanning lines on technical cards
  - Stake impact animation

**Related files**: packages/frontend/src/App.tsx, packages/frontend/src/App.css, packages/frontend/moloch1.png, packages/frontend/moloch2.png
# Framer Motion Animation Patterns

## LazyMotion for Bundle Size Optimization
Using Framer Motion with LazyMotion pattern to reduce bundle size:
- **Import**: `LazyMotion`, `domAnimation`, `m` (not `motion`)
- **Wrap components**: `<LazyMotion features={domAnimation}>`
- **Use 'm' elements**: `m.div`, `m.span` instead of `motion.div`, `motion.span`
- **Bundle savings**: domAnimation bundle (~15-20kb) vs full bundle (~60kb) = ~40kb saved
- **What's included**: springs, basic animations, page transitions, gestures (hover/tap)
- **What's excluded**: drag-n-drop and layout animations (not needed for this project)

**Why Framer Motion over react-spring**: Chosen because we'll need page transitions later, which Framer Motion handles better.

## Spring-Based Number Counter Animation
Pattern for video-game style counting animation using Framer Motion springs:

```tsx
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { m } from 'framer-motion';

function Counter({ amount }: { amount: number }) {
  // 1. Create reactive motion value
  const motionValue = useMotionValue(amount);

  // 2. Apply spring physics
  const springValue = useSpring(motionValue, {
    stiffness: 180,  // How tight/fast the spring
    damping: 30,      // Resistance/bounce amount (higher = less bounce)
    mass: 0.5         // Weight/snappiness
  });

  // 3. Round for display
  const rounded = useTransform(springValue, (latest) => Math.floor(latest));

  // 4. Update when prop changes
  useEffect(() => {
    motionValue.set(amount);
  }, [amount, motionValue]);

  // 5. Render with LazyMotion element
  return <m.span>{rounded}</m.span>;
}
```

### Spring Physics Parameters
- **stiffness: 180** - Keeps animation snappy and responsive
- **damping: 30** - Higher damping (vs 15) removes overshoot/bounce for smooth counting
- **mass: 0.5** - Light weight for quick animation start/stop

### Benefits
- Smooth count-up/down with natural feel
- Spring handles rapid changes smoothly - redirects mid-flight instead of restarting
- No jarring overshoot for counter displays
- Visual feedback for stat changes

**Related files**: packages/frontend/src/components/ChoiceToggle.tsx

## Hint Animation Pattern for Teaching Affordances
Micro-interaction pattern using Framer Motion springs to teach users about interactive elements:

```tsx
import { m } from 'framer-motion';
import { useState, useEffect } from 'react';

function InteractiveCard() {
  const [hintRotation, setHintRotation] = useState(0);

  useEffect(() => {
    // Show hint after 1s dwell time
    const showHint = setTimeout(() => setHintRotation(15), 1000);
    // Reset after showing hint
    const resetHint = setTimeout(() => setHintRotation(0), 1500);

    return () => {
      clearTimeout(showHint);
      clearTimeout(resetHint);
    };
  }, []);

  return (
    <m.div
      animate={{ rotateY: hintRotation }}
      transition={{
        type: "spring",
        stiffness: 200,  // Snappy response
        damping: 25,     // Allow bounce/overshoot for attention
        mass: 0.8        // Heavier feel for teaching moment
      }}
    >
      Card content
    </m.div>
  );
}
```

### Spring Configuration for Hints
- **stiffness: ~200** - Snappy, attention-grabbing
- **damping: ~25** - Lower than counter springs to allow bounce/overshoot
- **mass: ~0.8** - Heavier feel makes the hint more noticeable

### Pattern Flow
1. Component mounts with neutral state (rotation: 0)
2. setTimeout triggers state change after dwell period
3. Spring animates to hint position (partial rotation, etc.)
4. Second setTimeout resets state
5. Spring animates back to neutral

### Benefits Over CSS Keyframes
- More natural, organic motion with bounce/overshoot
- Can interrupt mid-animation smoothly if user interacts
- Consistent with other springs in the app
- Less code (no keyframe definitions, no transition classes)
- State-driven, easy to control timing and conditions

### Use Cases
- Flip cards: Show partial flip to indicate interactivity
- Buttons: Slight scale pulse to draw attention
- Drawers: Peek animation to reveal content
- Sliders: Wiggle to show draggability

**Related files**: packages/frontend/src/components/GameCard.tsx, packages/frontend/src/components/ChoiceToggle.tsx

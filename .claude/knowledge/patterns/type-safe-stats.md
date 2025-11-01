# Type-Safe Stat Names Pattern

## Separation of Data and Display
Refactored stats to separate data model from presentation logic:

### Data Model
```typescript
type StatName = 'intelligence' | 'charisma' | 'wisdom';

interface Choice {
  stats: {
    major: StatName;
    minor: StatName;
  };
  // ... other fields
}
```

### Display Logic in Component
Component adds formatting when rendering:
```tsx
// In ChoiceToggle.tsx
<div className={styles.stats}>
  <span className={styles.majorStat}>++{stats.major}</span>
  <span className={styles.minorStat}>+{stats.minor}</span>
</div>
```

## Benefits
- **Type safety**: TypeScript enforces valid stat names
- **Clean data**: Data model stores semantic information without presentation details
- **Display flexibility**: Easy to change formatting (icons, colors, etc.) without touching data
- **Presentation layer responsibility**: Display logic lives where it belongs - in the component

## Alternative Display Options
Because display logic is separate, we could easily switch to:
- Icons instead of text prefixes
- Color coding
- Visual indicators (bars, badges)
- Localized text

**Related files**: packages/frontend/src/components/ChoiceToggle.tsx, packages/frontend/src/components/ChoicesCard.tsx

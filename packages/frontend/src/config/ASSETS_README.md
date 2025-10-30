# Asset Management

## Quick CDN Swap

To switch all assets from local to CDN, just update `assets.ts`:

```typescript
// Change this line:
const USE_CDN = false;

// To this:
const USE_CDN = true;
const CDN_BASE_URL = 'https://your-cdn.com/assets';
```

All components using `ASSETS` will automatically use the CDN URLs.

## Usage in Components

```typescript
import { ASSETS } from '../config/assets';

// Simple usage
<img src={ASSETS.heroMoloch} />

// Override CDN per-asset (optional)
import { getAssetUrl } from '../config/assets';
<img src={getAssetUrl('heroMoloch', true)} /> // force CDN
<img src={getAssetUrl('heroMoloch', false)} /> // force local
```

## Adding New Assets

1. Add file to `public/assets/`
2. Add entry to `ASSETS` object in `assets.ts`:

```typescript
export const ASSETS = {
  myNewAsset: `${BASE_URL}/my-new-asset.png`,
} as const;
```

## Asset List

Current assets:
- `heroMoloch` - Hero battling Moloch image (720KB PNG)
- `nfcCard` - NFC card tap animation (52KB PNG)
- `helmetIcon` - Helmet SVG icon (2.4KB)
- `heartIcon` - Heart SVG icon (245B)

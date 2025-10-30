/**
 * Asset configuration
 * Easy to switch between local assets and CDN
 */

// Change this to switch between local and CDN assets
const USE_CDN = false;
const CDN_BASE_URL = 'https://your-cdn.com/assets';
const LOCAL_BASE_URL = '/assets';

const BASE_URL = USE_CDN ? CDN_BASE_URL : LOCAL_BASE_URL;

export const ASSETS = {
  // Images
  heroMoloch: `${BASE_URL}/hero-moloch.png`,
  nfcCard: `${BASE_URL}/nfc-card.png`,

  // SVG Icons
  helmetIcon: `${BASE_URL}/helmet-icon.svg`,
  heartIcon: `${BASE_URL}/heart-icon.svg`,
} as const;

// Helper to get asset URL with optional CDN override
export const getAssetUrl = (assetKey: keyof typeof ASSETS, useCDN?: boolean) => {
  if (useCDN !== undefined) {
    const baseUrl = useCDN ? CDN_BASE_URL : LOCAL_BASE_URL;
    const filename = ASSETS[assetKey].split('/').pop();
    return `${baseUrl}/${filename}`;
  }
  return ASSETS[assetKey];
};

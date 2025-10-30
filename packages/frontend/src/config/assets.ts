/**
 * Asset configuration
 * Easy to switch between local assets and CDN
 */

import helmetIconSvg from '/assets/helmet-icon.svg';
import heartIconSvg from '/assets/heart-icon.svg';
import heroMolochImg from '/assets/hero-moloch.png';
import nfcCardImg from '/assets/nfc-card.png';

export const ASSETS = {
  // Images - imported directly for better dev experience
  heroMoloch: heroMolochImg,
  nfcCard: nfcCardImg,

  // SVG Icons - imported directly for better dev experience
  helmetIcon: helmetIconSvg,
  heartIcon: heartIconSvg,
} as const;

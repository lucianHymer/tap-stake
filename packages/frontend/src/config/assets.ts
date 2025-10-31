/**
 * Asset configuration
 * Easy to switch between local assets and CDN
 */

import helmetIconSvg from '/assets/helmet-icon.svg';
import heartIconSvg from '/assets/heart-icon.svg';
import heroMolochImg from '/assets/hero-moloch.png';
import nfcCardImg from '/assets/nfc-card.png';
import heroChoicesImg from '/assets/hero-choices.png';
import swordIconSvg from '/assets/sword-icon.svg';
import wandIconSvg from '/assets/wand-icon.svg';
import xIconSvg from '/assets/x-icon.svg';

export const ASSETS = {
  // Images - imported directly for better dev experience
  heroMoloch: heroMolochImg,
  heroChoices: heroChoicesImg,
  nfcCard: nfcCardImg,

  // SVG Icons - imported directly for better dev experience
  helmetIcon: helmetIconSvg,
  heartIcon: heartIconSvg,
  swordIcon: swordIconSvg,
  wandIcon: wandIconSvg,
  xIcon: xIconSvg,
} as const;

/**
 * Asset configuration
 * Easy to switch between local assets and CDN
 */

import helmetIconSvg from '/assets/helmet-icon.svg';
import heartIconSvg from '/assets/heart-icon.svg';
import heroMolochImg from '/assets/hero-moloch.png';
import nfcCardImg from '/assets/nfc-card.png';
import heroChoicesImg from '/assets/hero-choices.png';
import heroSlainImg from '/assets/hero-slain.png';
import heroRisesImg from '/assets/hero-rises.png';
import swordIconSvg from '/assets/sword-icon.svg';
import wandIconSvg from '/assets/wand-icon.svg';
import xIconSvg from '/assets/x-icon-figma.svg';
import moneyBagImg from '/assets/moneyBag.png';
import burnerTapImg from '/assets/burnerTap.png';

// Class-specific images - compressed versions
import artificerChoiceImg from '/assets/GG-POC-SlayMoloch_Artificer.png';
import artificerSlainImg from '/assets/GG-POC-SlayMoloch_Artificer-Slayed-01.png';
import bardChoiceImg from '/assets/GG-POC-SlayMoloch_Bard.png';
import bardSlainImg from '/assets/GG-POC-SlayMoloch_Bard-Slayed.png';
import monkChoiceImg from '/assets/GG-POC-SlayMoloch_Monk.png';
import monkSlainImg from '/assets/GG-POC-SlayMoloch_Paladin-Slayed.png';
import paladinChoiceImg from '/assets/GG-POC-SlayMoloch_Paladin.png';
import paladinSlainImg from '/assets/GG-POC-SlayMoloch_Paladin-Slayed.png';
import seerChoiceImg from '/assets/GG-POC-SlayMoloch_Seer.png';
import seerSlainImg from '/assets/GG-POC-SlayMoloch_Seer-02.png';
import wizardChoiceImg from '/assets/GG-POC-SlayMoloch_Wizard-01.png';
import wizardSlainImg from '/assets/GG-POC-SlayMoloch_Wizard-02.png';

export const ASSETS = {
  // Images - imported directly for better dev experience
  heroMoloch: heroMolochImg,
  heroChoices: heroChoicesImg,
  heroSlain: heroSlainImg,
  heroRises: heroRisesImg,
  nfcCard: nfcCardImg,
  moneyBag: moneyBagImg,
  burnerTap: burnerTapImg,

  // SVG Icons - imported directly for better dev experience
  helmetIcon: helmetIconSvg,
  heartIcon: heartIconSvg,
  swordIcon: swordIconSvg,
  wandIcon: wandIconSvg,
  xIcon: xIconSvg,

  // Class-specific choice images
  classImages: {
    Decide: {
      choice: heroMolochImg,
      slain: heroMolochImg,
    },
    Artificer: {
      choice: artificerChoiceImg,
      slain: artificerSlainImg,
    },
    Bard: {
      choice: bardChoiceImg,
      slain: bardSlainImg,
    },
    Monk: {
      choice: monkChoiceImg,
      slain: monkSlainImg,
    },
    Paladin: {
      choice: paladinChoiceImg,
      slain: paladinSlainImg,
    },
    Seer: {
      choice: seerChoiceImg,
      slain: seerSlainImg,
    },
    Wizard: {
      choice: wizardChoiceImg,
      slain: wizardSlainImg,
    },
  },
} as const;

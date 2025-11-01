import { ASSETS } from '../config/assets';
import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
};

/**
 * Primary button variant
 */
export const Primary = () => <Button variant="primary">Continue</Button>;

/**
 * Outline button variant
 */
export const Outline = () => <Button variant="outline">Connect</Button>;

/**
 * Cancel button variant with X icons on both sides
 */
export const Cancel = () => (
  <Button variant="cancel" leftIcon={ASSETS.xIcon} rightIcon={ASSETS.xIcon}>
    Cancel
  </Button>
);

/**
 * Cancel variant with custom text
 */
export const CancelCustomText = () => (
  <Button variant="cancel" leftIcon={ASSETS.xIcon} rightIcon={ASSETS.xIcon}>
    Go Back
  </Button>
);

/**
 * Disabled cancel button
 */
export const CancelDisabled = () => (
  <Button variant="cancel" leftIcon={ASSETS.xIcon} rightIcon={ASSETS.xIcon} disabled>
    Cancel
  </Button>
);

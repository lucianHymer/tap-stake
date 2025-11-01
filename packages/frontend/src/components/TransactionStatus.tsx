import type React from 'react';
import { ASSETS } from '../config/assets';
import type { TransactionStatus as TransactionStatusType } from '../contexts/AppContext';
import { Button } from './Button';
import { GameCard } from './GameCard';
import styles from './TransactionStatus.module.css';

export interface TransactionStatusProps {
  status: TransactionStatusType;
  error: string | null;
  onClose?: () => void;
}

// Icon component
const SwordIcon = () => (
  <img src={ASSETS.swordIcon} alt="" style={{ width: '28px', height: '28px', display: 'block' }} />
);

/**
 * Get user-friendly error message from technical error
 */
function getReadableError(error: string | null): string {
  if (!error) return 'An unknown error occurred';

  const errorMap: Record<string, string> = {
    'Insufficient holdings': 'Your offering is too meager. You need at least 90 GTC.',
    'Invalid signature': 'The blood pact was corrupted. Please try again.',
    'Network error': 'The ethereal connection faltered. Try again.',
    'Transaction failed': 'Moloch deflected your attack. Try again.',
    'User rejected': 'You hesitated at the crucial moment.',
    'not enough': 'Insufficient balance. You need more GTC.',
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  return error;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({ status, error, onClose }) => {
  return (
    <div className={styles.transactionStatusPage}>
      <GameCard
        variant="default"
        heading="Slaying Moloch..."
        headingIcons={[<SwordIcon key="sword" />]}
        subheading={
          status === 'signing'
            ? 'Signing'
            : status === 'submitting'
              ? 'Submitting'
              : status === 'success'
                ? 'Success'
                : 'Failed'
        }
        heroImage={ASSETS.heroMoloch}
        heroImageAlt="Transaction in progress"
        primaryAction={<div />}
      >
        <div className={styles.transactionContent}>
          {status === 'signing' && (
            <>
              <div className={styles.statusIcon}>⚔️</div>
              <h3 className={styles.statusHeading}>Preparing to Slay...</h3>
              <p className={styles.statusText}>Tap your card to sign the blood pact</p>
            </>
          )}

          {status === 'submitting' && (
            <>
              <div className={styles.statusIcon}>🔥</div>
              <h3 className={styles.statusHeading}>Slaying Moloch...</h3>
              <p className={styles.statusText}>The demon writhes in agony</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className={styles.statusIcon}>✨</div>
              <h3 className={styles.statusHeading}>Moloch is Slain!</h3>
              <p className={styles.statusText}>Coordination has been restored</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className={styles.statusIcon}>💀</div>
              <h3 className={styles.statusHeading}>The Demon Resists!</h3>
              <p className={styles.errorText}>{getReadableError(error)}</p>
              {onClose && (
                <Button variant="primary" onClick={onClose}>
                  Try Again
                </Button>
              )}
            </>
          )}
        </div>
      </GameCard>
    </div>
  );
};

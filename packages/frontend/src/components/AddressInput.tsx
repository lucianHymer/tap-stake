import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { isAddress } from 'viem';
import { useEnsAddress } from 'wagmi';
import styles from './AddressInput.module.css';

export interface AddressInputProps {
  /** Callback when a valid address is confirmed */
  onAddressChange?: (address: string | null, ensName?: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  onAddressChange,
  placeholder = '0x... or name.eth',
  label = 'Destination Address',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [validationState, setValidationState] = useState<
    'neutral' | 'valid' | 'invalid' | 'resolving'
  >('neutral');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Debounce the input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Check if it looks like an ENS name
  // ENS names can start with 0x, so we check for common TLDs instead
  const looksLikeENS = (value: string) => {
    const ensPattern = /\.(eth|xyz|luxe|kred|art|club|id)$/i;
    return ensPattern.test(value);
  };

  // ENS resolution hook - only active when input looks like ENS
  const shouldResolveENS = looksLikeENS(debouncedValue) && debouncedValue.length > 0;
  const {
    data: ensResolvedAddress,
    isLoading: isResolvingENS,
    error: ensError,
  } = useEnsAddress({
    name: shouldResolveENS ? debouncedValue : undefined,
    chainId: 1, // Use mainnet for ENS resolution
    query: {
      enabled: shouldResolveENS,
    },
  });

  // Validation logic
  useEffect(() => {
    if (debouncedValue.trim() === '') {
      setValidationState('neutral');
      setResolvedAddress(null);
      setErrorMessage('');
      onAddressChange?.(null);
      return;
    }

    // Check if it's a direct Ethereum address
    if (isAddress(debouncedValue)) {
      setValidationState('valid');
      setResolvedAddress(debouncedValue);
      setErrorMessage('');
      onAddressChange?.(debouncedValue);
      return;
    }

    // Check if it looks like ENS
    if (looksLikeENS(debouncedValue)) {
      if (isResolvingENS) {
        setValidationState('resolving');
        setErrorMessage('');
        return;
      }

      if (ensResolvedAddress) {
        setValidationState('valid');
        setResolvedAddress(ensResolvedAddress);
        setErrorMessage('');
        onAddressChange?.(ensResolvedAddress, debouncedValue);
        return;
      }
      // ENS resolution completed but no address found
      setValidationState('invalid');
      if (ensError) {
        setErrorMessage(`ENS error: ${ensError.message}`);
      } else {
        setErrorMessage('ENS name not found');
      }
      setResolvedAddress(null);
      onAddressChange?.(null);
      return;
    }

    // Invalid format
    setValidationState('invalid');
    setErrorMessage('Invalid address format');
    setResolvedAddress(null);
    onAddressChange?.(null);
  }, [debouncedValue, ensResolvedAddress, isResolvingENS, ensError, onAddressChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={`${styles.inputWrapper} ${styles[validationState]}`}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={styles.input}
        />
      </div>
      {validationState === 'resolving' && (
        <div className={styles.message}>Resolving ENS name...</div>
      )}
      {validationState === 'valid' && resolvedAddress && (
        <div className={styles.successMessage}>
          {looksLikeENS(inputValue) ? (
            <>
              Resolved to:{' '}
              <span className={styles.address}>
                {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
              </span>
            </>
          ) : (
            'Valid address'
          )}
        </div>
      )}
      {validationState === 'invalid' && errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
    </div>
  );
};

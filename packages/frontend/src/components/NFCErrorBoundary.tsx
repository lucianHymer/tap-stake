import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import './NFCErrorBoundary.css';
import { resetNFCConnection } from '../lib/nfcResource';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NFCErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NFC connection error:', error, errorInfo);
  }

  private handleRetry = () => {
    resetNFCConnection();
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private parseErrorMessage(errorMessage: string): { title: string; message: string; category: string } {
    // Parse error codes from nfc.ts error messages
    if (errorMessage.includes('NFC_DESKTOP_UNSUPPORTED')) {
      return {
        category: 'desktop',
        title: 'DESKTOP DETECTED',
        message: 'Desktop browsers require HaLo Bridge with a USB NFC reader. Visit halo.arx.org/bridge for installation instructions.'
      };
    }

    if (errorMessage.includes('NFC_BROWSER_UNSUPPORTED')) {
      return {
        category: 'browser',
        title: 'INCOMPATIBLE BROWSER',
        message: 'Use Chrome or Safari on mobile for NFC support. If you\'re already using a compatible browser, try refreshing the page.'
      };
    }

    if (errorMessage.includes('NFC_IOS_LIMITED')) {
      return {
        category: 'ios',
        title: 'iOS LIMITATIONS',
        message: 'iOS has limited Web NFC support. Ensure NFC is enabled in Settings and try using Safari.'
      };
    }

    if (errorMessage.includes('NFC_DISABLED')) {
      return {
        category: 'disabled',
        title: 'NFC DISABLED',
        message: 'NFC may be disabled on your device. Enable NFC in your device settings and try again.'
      };
    }

    if (errorMessage.includes('NFC_CARD_READ_FAILED')) {
      return {
        category: 'card',
        title: 'CARD READ FAILED',
        message: 'Failed to read NFC card. Please ensure your card is properly positioned and try again.'
      };
    }

    // Fallback for other errors
    return {
      category: 'unknown',
      title: 'CONNECTION FAILED',
      message: 'An unexpected error occurred. Please try again or check the technical details below.'
    };
  }

  public render() {
    if (this.state.hasError) {
      const parsedError = this.parseErrorMessage(this.state.error?.message || '');

      return (
        <div className="nfc-error-container">
          <div className="nfc-error-content">
            <h1 className="nfc-error-title">
              {parsedError.title}
            </h1>

            <div className="error-icon">⚠️</div>

            <p className="nfc-error-message">
              {parsedError.message}
            </p>

            <div className="nfc-error-details">
              <details>
                <summary>Technical Details</summary>
                <pre>{this.state.error?.message}</pre>
              </details>
            </div>

            <button className="retry-button" onClick={this.handleRetry}>
              TRY AGAIN
            </button>

            <div className="future-wallet-options">
              {/* Space for future wallet connection options */}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
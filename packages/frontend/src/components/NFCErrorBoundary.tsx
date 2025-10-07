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

  private parseErrorMessage(errorMessage: string): { title: string; message: string } {
    // Extract the user-friendly message after the error code
    const colonIndex = errorMessage.indexOf(':');
    if (colonIndex !== -1) {
      return {
        title: 'CONNECTION FAILED',
        message: errorMessage.substring(colonIndex + 1).trim()
      };
    }

    // Fallback for other errors
    return {
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
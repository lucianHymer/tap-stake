import React, { Component, ErrorInfo, ReactNode } from 'react';
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

  public render() {
    if (this.state.hasError) {
      const isNFCSupported = this.state.error?.message.includes('not supported') || 
                            this.state.error?.message.includes('can\'t be used');
      
      return (
        <div className="nfc-error-container">
          <div className="nfc-error-content">
            <h1 className="nfc-error-title">
              {isNFCSupported ? 'NFC NOT AVAILABLE' : 'CONNECTION FAILED'}
            </h1>
            
            <div className="error-icon">⚠️</div>
            
            <p className="nfc-error-message">
              {isNFCSupported 
                ? 'Your device or browser does not support NFC connections. Please use a compatible device or install HaLo Bridge for desktop.'
                : 'Failed to connect to your NFC card. Please ensure your card is properly positioned and try again.'}
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
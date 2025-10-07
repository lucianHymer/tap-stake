import './NFCPrompt.css';
import baphometImage from '../assets/images/baphomet.jpg';

interface NFCPromptProps {
  onConnect: () => void;
  connecting?: boolean;
}

export function NFCPrompt({ onConnect, connecting = false }: NFCPromptProps) {
  return (
    <div className="nfc-prompt-container">
      <div className="nfc-prompt-content">
        <h1 className="title nfc-prompt-title">
          <span>TAP</span>
          <span>STAKE</span>
        </h1>

        <div className="nfc-icon-container">
          <div className="nfc-icon">
            {connecting && (
              <>
                <div className="nfc-pulse"></div>
                <div className="nfc-pulse-delayed"></div>
              </>
            )}
            <img
              src={baphometImage}
              alt="Baphomet"
              className="nfc-symbol"
              style={{width: '120px', height: '120px', objectFit: 'contain', filter: 'invert(1)'}}
            />
          </div>
        </div>

        <button
          onClick={onConnect}
          className="retry-button"
          disabled={connecting}
        >
          {connecting ? 'CONNECTING...' : 'CONNECT NFC'}
        </button>
      </div>
    </div>
  );
}

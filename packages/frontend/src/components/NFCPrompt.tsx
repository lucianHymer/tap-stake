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
        <h1 className="title">
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

        <p className="nfc-prompt-text">
          {connecting
            ? 'Hold your NFC card against your device to enter the demon-slaying realm'
            : 'Prepare to enter the demon-slaying realm'
          }
        </p>

        {connecting ? (
          <div className="nfc-prompt-waiting">
            <span className="dot-1">.</span>
            <span className="dot-2">.</span>
            <span className="dot-3">.</span>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="retry-button"
            style={{ marginTop: '2rem' }}
          >
            CONNECT NFC
          </button>
        )}

        <div className="future-escape-hatch">
          {/* Space reserved for future "Connect differently →" link */}
        </div>
      </div>
    </div>
  );
}
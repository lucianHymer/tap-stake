import React from 'react';
import './NFCPrompt.css';

export function NFCPrompt() {
  return (
    <div className="nfc-prompt-container">
      <div className="nfc-prompt-content">
        <h1 className="title">
          <span>TAP</span>
          <span>STAKE</span>
        </h1>
        
        <div className="nfc-icon-container">
          <div className="nfc-icon">
            <div className="nfc-pulse"></div>
            <div className="nfc-pulse-delayed"></div>
            <img 
              src="/baphomet.jpg" 
              alt="Baphomet" 
              className="nfc-symbol"
              style={{width: '120px', height: '120px', objectFit: 'contain', filter: 'invert(1)'}}
            />
          </div>
        </div>
        
        <p className="nfc-prompt-text">
          Hold your NFC card against your device to enter the demon-slaying realm
        </p>
        
        <div className="nfc-prompt-waiting">
          <span className="dot-1">.</span>
          <span className="dot-2">.</span>
          <span className="dot-3">.</span>
        </div>

        <div className="future-escape-hatch">
          {/* Space reserved for future "Connect differently →" link */}
          {/* Uncomment for testing without NFC: */}
          {/* <button onClick={() => window.location.reload()} style={{marginTop: '2rem', opacity: 0.5}}>
            Skip NFC (Dev Only)
          </button> */}
        </div>
      </div>
    </div>
  );
}
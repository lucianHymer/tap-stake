import { useState } from "react";
import { getCardData } from "../lib/nfc";
import styles from "./DebugPage.module.css";

export function DebugPage() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScanCard = async () => {
    try {
      setStatus('scanning');
      setError(null);
      setAddress(null);

      const cardData = await getCardData(() => {
        // This callback is called right before the NFC prompt
        console.log("NFC prompt active - user should tap now");
      });

      if (cardData.address) {
        setAddress(cardData.address);
        setStatus('success');
      } else {
        throw new Error("No address found in slot 8");
      }
    } catch (err) {
      console.error("Error reading NFC card:", err);
      setError(err instanceof Error ? err.message : "Failed to read card");
      setStatus('error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>NFC Debug</h1>
        <p className={styles.subtitle}>Read address from card slot 8</p>

        <button
          className={styles.scanButton}
          onClick={handleScanCard}
          disabled={status === 'scanning'}
        >
          {status === 'scanning' ? 'Tap your card now...' : 'Scan NFC Card'}
        </button>

        {status === 'scanning' && (
          <div className={styles.statusMessage}>
            <div className={styles.spinner}></div>
            <p>Waiting for NFC card...</p>
            <p className={styles.hint}>Hold your card to the reader</p>
          </div>
        )}

        {status === 'success' && address && (
          <div className={styles.result}>
            <h3>Slot 8 Address:</h3>
            <code className={styles.address}>{address}</code>
            <button
              className={styles.copyButton}
              onClick={() => navigator.clipboard.writeText(address)}
            >
              Copy Address
            </button>
          </div>
        )}

        {status === 'error' && error && (
          <div className={styles.error}>
            <h3>Error:</h3>
            <p>{error}</p>
            {error.includes("IP address") && (
              <p className={styles.errorHint}>
                For network testing, use ngrok or a domain name instead of IP addresses.
              </p>
            )}
            {error.includes("HaLo Bridge") && (
              <p className={styles.errorHint}>
                Desktop users: Make sure HaLo Bridge is running with your USB NFC reader.
              </p>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <p>
            Card not initialized? Visit{' '}
            <a
              href="https://boot.burner.pro"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              boot.burner.pro
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
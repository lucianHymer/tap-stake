import { Suspense } from 'react';
import { NFCErrorBoundary } from './components/NFCErrorBoundary';
import { NFCPrompt } from './components/NFCPrompt';
import { DemonSlayer } from './components/DemonSlayer';
import { readNFCConnection } from './lib/nfcResource';
import './App.css';

function AppWithNFC() {
  const connection = readNFCConnection();
  return <DemonSlayer connection={connection} />;
}

function App() {
  return (
    <NFCErrorBoundary>
      <Suspense fallback={<NFCPrompt />}>
        <AppWithNFC />
      </Suspense>
    </NFCErrorBoundary>
  );
}

export default App

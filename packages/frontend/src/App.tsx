import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { DemonSlayer } from './components/DemonSlayer';
import { NFCErrorBoundary } from './components/NFCErrorBoundary';
import { NFCPrompt } from './components/NFCPrompt';
import { ConnectCard } from './components/ConnectCard';
import { ButtonDemo } from './pages/ButtonDemo';
import { ToggleButtonDemo } from './pages/ToggleButtonDemo';
import { wagmiConfig } from './config/wagmi';
import { readNFCConnection } from './lib/nfcResource';
import './App.css';

const queryClient = new QueryClient();

function AppWithNFC() {
  const connection = readNFCConnection();
  return <DemonSlayer connection={connection} />;
}

function HomePage() {
  const [startConnection, setStartConnection] = useState(false);

  if (!startConnection) {
    return <NFCPrompt onConnect={() => setStartConnection(true)} />;
  }

  return (
    <NFCErrorBoundary>
      <Suspense fallback={<NFCPrompt onConnect={() => {}} connecting={true} />}>
        <AppWithNFC />
      </Suspense>
    </NFCErrorBoundary>
  );
}

function AdminPage() {
  return (
    <div
      style={{
        color: '#ff0000',
        textAlign: 'center',
        marginTop: '100px',
        fontSize: '2rem',
      }}
    >
      TODO: Admin panel
    </div>
  );
}

function TestPage() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        touchAction: 'none',
        background: '#12061f',
      }}
    >
      <ConnectCard onConnect={() => console.log('Connect clicked!')} />
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/button-demo" element={<ButtonDemo />} />
            <Route path="/toggle-demo" element={<ToggleButtonDemo />} />
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </HashRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

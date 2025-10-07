import { Suspense, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NFCErrorBoundary } from './components/NFCErrorBoundary';
import { NFCPrompt } from './components/NFCPrompt';
import { DemonSlayer } from './components/DemonSlayer';
import { readNFCConnection } from './lib/nfcResource';
import { wagmiConfig } from './config/wagmi';
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
    <div style={{
      color: '#ff0000',
      textAlign: 'center',
      marginTop: '100px',
      fontSize: '2rem'
    }}>
      TODO: Admin panel
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
          </Routes>
        </HashRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App

import { Suspense, useState } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
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
          <div>
            <nav style={{
              background: 'rgba(0,0,0,0.9)',
              padding: '10px',
              borderBottom: '2px solid #ff0000',
              marginBottom: '20px'
            }}>
              <Link to="/" style={{
                color: '#ff0000',
                textDecoration: 'none',
                marginRight: '20px',
                fontWeight: 'bold'
              }}>
                NFC DEMON SLAYER
              </Link>
              <Link to="/admin" style={{
                color: '#888',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}>
                ADMIN
              </Link>
            </nav>

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        </HashRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App

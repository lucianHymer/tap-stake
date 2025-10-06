import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NFCErrorBoundary } from './components/NFCErrorBoundary';
import { NFCPrompt } from './components/NFCPrompt';
import { DemonSlayer } from './components/DemonSlayer';
import { EIP7702Experimental } from './pages/EIP7702Experimental';
import { EIP7702NFC } from './pages/EIP7702NFC';
import { EIP7702Relayed } from './pages/EIP7702Relayed';
import { Demo } from './pages/Demo';
import { readNFCConnection } from './lib/nfcResource';
import { wagmiConfig } from './config/wagmi';
import './App.css';

const queryClient = new QueryClient();

function AppWithNFC() {
  const connection = readNFCConnection();
  return <DemonSlayer connection={connection} />;
}

function HomePage() {
  return (
    <NFCErrorBoundary>
      <Suspense fallback={<NFCPrompt />}>
        <AppWithNFC />
      </Suspense>
    </NFCErrorBoundary>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/tap-stake">
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
              <Link to="/eip7702" style={{
                color: '#ff0000',
                textDecoration: 'none',
                marginRight: '20px',
                fontWeight: 'bold'
              }}>
                EIP-7702 (PRIVATE KEY)
              </Link>
              <Link to="/eip7702-nfc" style={{
                color: '#ff0000',
                textDecoration: 'none',
                marginRight: '20px',
                fontWeight: 'bold'
              }}>
                EIP-7702 NFC
              </Link>
              <Link to="/eip7702-relayed" style={{
                color: '#00ff00',
                textDecoration: 'none',
                marginRight: '20px',
                fontWeight: 'bold',
                textShadow: '0 0 10px #00ff00'
              }}>
                ✨ EIP-7702 GASLESS
              </Link>
              <Link to="/demo" style={{
                color: '#ffff00',
                textDecoration: 'none',
                fontWeight: 'bold',
                textShadow: '0 0 10px #ffff00'
              }}>
                🧪 DEMO (NO NFC)
              </Link>
            </nav>

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/eip7702" element={<EIP7702Experimental />} />
              <Route path="/eip7702-nfc" element={<EIP7702NFC />} />
              <Route path="/eip7702-relayed" element={<EIP7702Relayed />} />
              <Route path="/demo" element={<Demo />} />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App

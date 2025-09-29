import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NFCErrorBoundary } from './components/NFCErrorBoundary';
import { NFCPrompt } from './components/NFCPrompt';
import { DemonSlayer } from './components/DemonSlayer';
import { EIP7702Experimental } from './pages/EIP7702Experimental';
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
        <BrowserRouter>
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
                fontWeight: 'bold'
              }}>
                EIP-7702 DEMO
              </Link>
            </nav>

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/eip7702" element={<EIP7702Experimental />} />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App

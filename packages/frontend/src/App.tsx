import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { DemonSlayer } from './components/DemonSlayer';
import { NFCErrorBoundary } from './components/NFCErrorBoundary';
import { NFCPrompt } from './components/NFCPrompt';
import { ProtectedRoute } from './components/ProtectedRoute';
import { wagmiConfig } from './config/wagmi';
import { AppProvider } from './contexts/AppContext';
import { readNFCConnection } from './lib/nfcResource';
import { ButtonDemo } from './pages/ButtonDemo';
import { ChoicesPage } from './pages/ChoicesPage';
import { ConnectPage } from './pages/ConnectPage';
import { SlainPage } from './pages/SlainPage';
import { TestPage as TestSetupPage } from './pages/TestPage';
import { ToggleButtonDemo } from './pages/ToggleButtonDemo';
import { WithdrawPage } from './pages/WithdrawPage';
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

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <HashRouter>
            <Routes>
              {/* Main user flow */}
              <Route path="/" element={<ConnectPage />} />
              <Route
                path="/choices"
                element={
                  <ProtectedRoute>
                    <ChoicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/slain"
                element={
                  <ProtectedRoute>
                    <SlainPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/withdraw"
                element={
                  <ProtectedRoute>
                    <WithdrawPage />
                  </ProtectedRoute>
                }
              />

              {/* Test/setup page */}
              <Route path="/test" element={<TestSetupPage />} />

              {/* Admin and demos */}
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </HashRouter>
        </AppProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

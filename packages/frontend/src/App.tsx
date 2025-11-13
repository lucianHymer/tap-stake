import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CHAIN_ID } from "./config/chain";
import { wagmiConfig } from "./config/wagmi";
import { AppProvider } from "./contexts/AppContext";
import { ChoicesPage } from "./pages/ChoicesPage";
import { ConnectPage } from "./pages/ConnectPage";
import { SlainPage } from "./pages/SlainPage";
import { StatsPage } from "./pages/StatsPage";
import { TestPage as TestSetupPage } from "./pages/TestPage";
import { WithdrawPage } from "./pages/WithdrawPage";
import Slot8Test from "./pages/Slot8Test";
import { DebugPage } from "./pages/DebugPage";
import "./App.css";

const queryClient = new QueryClient();

function AdminPage() {
  return (
    <div
      style={{
        color: "#ff0000",
        textAlign: "center",
        marginTop: "100px",
        fontSize: "2rem",
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

              {/* Testnet-only routes */}
              {CHAIN_ID === 11155420 && (
                <>
                  {/* Test/setup page for testnet token minting */}
                  <Route path="/test" element={<TestSetupPage />} />

                  {/* Slot 8 test page */}
                  <Route path="/slot8" element={<Slot8Test />} />
                </>
              )}

              {/* Public stats page */}
              <Route path="/stats" element={<StatsPage />} />

              {/* Debug page - works in production and testnet */}
              <Route path="/debug" element={<DebugPage />} />

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

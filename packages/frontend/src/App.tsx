import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { wagmiConfig } from "./config/wagmi";
import { AppProvider } from "./contexts/AppContext";
import { ChoicesPage } from "./pages/ChoicesPage";
import { ConnectPage } from "./pages/ConnectPage";
import { SlainPage } from "./pages/SlainPage";
import { StatsPage } from "./pages/StatsPage";
import { TestPage as TestSetupPage } from "./pages/TestPage";
import { WithdrawPage } from "./pages/WithdrawPage";
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

              {/* Test/setup page */}
              <Route path="/test" element={<TestSetupPage />} />

              {/* Public stats page */}
              <Route path="/stats" element={<StatsPage />} />

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

import { type ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route guard that redirects to ConnectPage if no active connection exists.
 * Ensures users always go through the connect flow on page load.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // If no connection, redirect to connect page
    if (!state.connection.connectedAddress || !state.connection.account) {
      console.log("🛡️ ProtectedRoute: No connection found, redirecting to /");
      navigate("/");
    }
  }, [state.connection.connectedAddress, state.connection.account, navigate]);

  // Don't render children if no connection (will redirect in useEffect)
  if (!state.connection.connectedAddress || !state.connection.account) {
    return null;
  }

  return <>{children}</>;
}

import { type ReactNode, createContext, useContext, useMemo, useState } from "react";

// Connection state - using `any` for account to support both NFC and generated wallet accounts
export interface ConnectionState {
  connectedAddress: `0x${string}` | null;
  account: any | null; // Can be NFC account or PrivateKeyAccount
  isGeneratedWallet: boolean;
}

// Balance state
export interface BalanceState {
  walletBalance: bigint;
  existingStakes: Map<string, bigint>; // choiceName → amount
}

// Transaction state
export type TransactionStatus =
  | "idle"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export interface TransactionState {
  status: TransactionStatus;
  error: string | null;
  txHash: string | null;
}

// Full app state
export interface AppState {
  // Connection
  connection: ConnectionState;

  // Balances
  balances: BalanceState;

  // User selections (persisted between pages)
  selectedChoices: Set<string>; // choice IDs (giveth, karma, etc)

  // Transaction
  transaction: TransactionState;
}

// Actions
export interface AppActions {
  setConnection: (connection: Partial<ConnectionState>) => void;
  setBalances: (balances: Partial<BalanceState>) => void;
  setSelectedChoices: (choices: Set<string>) => void;
  toggleChoice: (choiceId: string) => void;
  setTransactionStatus: (status: TransactionStatus) => void;
  setTransactionError: (error: string | null) => void;
  setTransactionHash: (txHash: string | null) => void;
  resetTransaction: () => void;
  resetAll: () => void;
}

// Derived/computed values
export interface DerivedState {
  totalAmount: number; // min(walletBalance + totalStaked, 100)
}

// Context type
interface AppContextType {
  state: AppState;
  actions: AppActions;
  derived: DerivedState;
}

// Create context
const AppContext = createContext<AppContextType | null>(null);

// Initial state
const initialState: AppState = {
  connection: {
    connectedAddress: null,
    account: null,
    isGeneratedWallet: false,
  },
  balances: {
    walletBalance: 0n,
    existingStakes: new Map(),
  },
  selectedChoices: new Set(),
  transaction: {
    status: "idle",
    error: null,
    txHash: null,
  },
};

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // Compute derived values
  const derived: DerivedState = useMemo(() => {
    // Sum all existing stakes
    const totalStaked = Array.from(state.balances.existingStakes.values()).reduce(
      (sum, amount) => sum + amount,
      0n,
    );

    // Total holdings = wallet balance + staked balance
    const totalHoldings = state.balances.walletBalance + totalStaked;

    // Convert to number (assuming tokens have 18 decimals)
    const totalHoldingsNum = Number(totalHoldings) / 1e18;

    // Cap at 100
    const totalAmount = Math.min(totalHoldingsNum, 100);

    return { totalAmount };
  }, [state.balances.walletBalance, state.balances.existingStakes]);

  const actions: AppActions = {
    setConnection: (connection) => {
      setState((prev) => ({
        ...prev,
        connection: { ...prev.connection, ...connection },
      }));
    },

    setBalances: (balances) => {
      setState((prev) => ({
        ...prev,
        balances: { ...prev.balances, ...balances },
      }));
    },

    setSelectedChoices: (choices) => {
      setState((prev) => ({
        ...prev,
        selectedChoices: choices,
      }));
    },

    toggleChoice: (choiceId) => {
      setState((prev) => {
        const newChoices = new Set(prev.selectedChoices);
        if (newChoices.has(choiceId)) {
          newChoices.delete(choiceId);
        } else {
          newChoices.add(choiceId);
        }
        return {
          ...prev,
          selectedChoices: newChoices,
        };
      });
    },

    setTransactionStatus: (status) => {
      setState((prev) => ({
        ...prev,
        transaction: { ...prev.transaction, status },
      }));
    },

    setTransactionError: (error) => {
      setState((prev) => ({
        ...prev,
        transaction: { ...prev.transaction, error },
      }));
    },

    setTransactionHash: (txHash) => {
      setState((prev) => ({
        ...prev,
        transaction: { ...prev.transaction, txHash },
      }));
    },

    resetTransaction: () => {
      setState((prev) => ({
        ...prev,
        transaction: initialState.transaction,
      }));
    },

    resetAll: () => {
      setState(initialState);
    },
  };

  return (
    <AppContext.Provider value={{ state, actions, derived }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}

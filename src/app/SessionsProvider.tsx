// Core
import React, { createContext, useContext } from 'react';

// Hooks
import { UseSessionsStoreResult, useSessionsStore } from '@/hooks/useSessionsStore';

const SessionsContext = createContext<UseSessionsStoreResult | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const SessionsProvider = ({ children }: Props) => {
  const store = useSessionsStore();
  return <SessionsContext.Provider value={store}>{children}</SessionsContext.Provider>;
};

export const useSessions = (): UseSessionsStoreResult => {
  const context = useContext(SessionsContext);
  if (!context) {
    throw new Error('useSessions must be used inside SessionsProvider');
  }

  return context;
};

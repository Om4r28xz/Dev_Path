import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '../features/auth/SessionProvider.js';
import { queryClient } from '../lib/session/session.js';
import { AppRouter } from './router.js';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default App;

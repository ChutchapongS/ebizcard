'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const devOverride = process.env.NEXT_PUBLIC_ENABLE_CLIENT_LOGS === 'true';

    if (!isProd || devOverride) {
      return;
    }

    const methods = ['log', 'info', 'debug', 'warn', 'error'] as const;
    type ConsoleMethod = (typeof methods)[number];
    const originalConsole: Partial<Record<ConsoleMethod, (...args: unknown[]) => void>> = {};
    const noop: (...args: unknown[]) => void = () => undefined;

    methods.forEach((method) => {
      originalConsole[method] = console[method] as Console['log'];
      console[method] = noop as Console['log'];
    });

    return () => {
      methods.forEach((method) => {
        if (originalConsole[method]) {
          console[method] = originalConsole[method]! as Console['log'];
        }
      });
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

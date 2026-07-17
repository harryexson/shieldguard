'use client';

import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

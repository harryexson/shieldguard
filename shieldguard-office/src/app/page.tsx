'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="text-6xl mb-4">🛡️</div>
        <div className="text-xl text-gray-400">Loading ShieldGuard...</div>
      </div>
    </div>
  );
}

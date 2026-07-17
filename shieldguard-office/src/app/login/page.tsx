'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, MOCK_USERS } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch {
      toast.error('Invalid email or password. Check the credentials below.');
    }
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-md border-gray-800 bg-gray-900">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-100">
              ShieldGuard
            </h1>
            <p className="mt-1 text-sm text-gray-400">Back Office</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">
                Developer Admin
              </span>
            </div>
            <button
              type="button"
              onClick={() => fillCredentials('admin@shieldguard.dev', 'ShieldGuard2024!')}
              className="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-emerald-500/10"
            >
              <span className="font-semibold text-emerald-300">admin@shieldguard.dev</span>
              <span className="ml-2 text-xs text-gray-500">
                (Super Admin)
              </span>
              <div className="mt-0.5 text-xs text-gray-600">
                Password: <span className="font-mono text-gray-400">ShieldGuard2024!</span>
              </div>
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-3 text-xs text-gray-500">
              All demo accounts (click to fill):
            </div>
            <div className="space-y-1">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => fillCredentials(user.email, `${user.name.split(' ')[0].toLowerCase()}123`)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
                >
                  <span className="font-medium text-gray-300">{user.email}</span>
                  <span className="ml-2 text-xs text-gray-600">
                    ({ROLE_LABELS[user.role]})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

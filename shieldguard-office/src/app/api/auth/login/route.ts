import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, stripPassword } from '@/lib/users';
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = (body.email || '').trim();
  const password = body.password || '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = verifyPassword(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = createSessionToken(user);
  const res = NextResponse.json({ user: stripPassword(user) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

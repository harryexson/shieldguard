import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { DEMO_USERS, stripPassword } from '@/lib/users';

export async function GET(_request: NextRequest) {
  const store = await cookies();
  const token = store.get('sg_session')?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const match = DEMO_USERS.find((u) => u.id === session.sub);
  if (!match) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: stripPassword(match) });
}

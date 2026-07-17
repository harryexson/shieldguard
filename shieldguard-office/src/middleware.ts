import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'sg_session';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/scan',
  '/crm',
  '/billing',
  '/support',
  '/admin',
  '/enterprise',
  '/sales',
  '/marketing',
  '/accounting',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/scan/:path*',
    '/crm/:path*',
    '/billing/:path*',
    '/support/:path*',
    '/admin/:path*',
    '/enterprise/:path*',
    '/sales/:path*',
    '/marketing/:path*',
    '/accounting/:path*',
  ],
};

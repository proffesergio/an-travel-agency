import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// NextAuth v5 default cookie names. We check existence only — full session
// validation happens server-side in the admin layout. This is the recommended
// "optimistic check" pattern for Next.js Proxy (do not run slow auth in proxy).
const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith('/admin');
  const isLoginPath = pathname.startsWith('/admin/login');
  const isApiPath = pathname.startsWith('/api');

  if (isAdminPath) {
    const hasSession = SESSION_COOKIE_NAMES.some((name) => request.cookies.get(name));

    if (!isLoginPath && !hasSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isLoginPath && hasSession) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (isApiPath) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};

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

// Behind LiteSpeed/Passenger on cPanel, the Host header forwarded to the
// Node process includes the internal port (atharnurtravels.com:3000) and the
// protocol arrives as http even though the user navigated over https. If we
// build redirect URLs from `request.url`/`request.nextUrl` as-is, next-intl's
// locale redirect and our admin redirects end up pointing at the internal
// origin, which the browser refuses. Rewrite the URL up front using
// NEXT_PUBLIC_APP_URL so every redirect downstream uses the public origin.
function normalizePublicOrigin(request: NextRequest) {
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!publicAppUrl) return;
  try {
    const canonical = new URL(publicAppUrl);
    request.nextUrl.protocol = canonical.protocol;
    request.nextUrl.host = canonical.host;
    request.nextUrl.port = canonical.port;
  } catch {
    // bad NEXT_PUBLIC_APP_URL — leave the request as-is
  }
}

export function proxy(request: NextRequest) {
  normalizePublicOrigin(request);

  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith('/admin');
  const isLoginPath = pathname.startsWith('/admin/login');
  const isApiPath = pathname.startsWith('/api');

  if (isAdminPath) {
    const hasSession = SESSION_COOKIE_NAMES.some((name) => request.cookies.get(name));

    if (!isLoginPath && !hasSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }
    if (isLoginPath && hasSession) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/admin';
      return NextResponse.redirect(dashboardUrl);
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

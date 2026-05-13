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

// Public origin for redirect URLs. The Node process runs behind LiteSpeed/
// Passenger on cPanel, which forwards Host as `atharnurtravels.com:3000`
// (the internal port leaks into the header). Without normalization, every
// 30x redirect — next-intl's locale redirect, our admin redirects — points
// at that internal origin and the browser refuses to follow it.
//
// We resolve the origin once at module load: env var first, hardcoded
// fallback if it's missing. The fallback exists because a missing cPanel
// env var has been a recurring failure mode during this deployment.
const PUBLIC_ORIGIN: URL = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) {
    try {
      return new URL(fromEnv);
    } catch {
      // malformed env var — fall through to hardcoded default
    }
  }
  return new URL('https://atharnurtravels.com');
})();

// Rewrite a 30x response's Location header to use the public origin.
// next-intl builds the locale redirect from `request.url`, which carries the
// leaked `:3000`. We can't change request.url, but we can fix the response
// before it leaves the middleware.
function normalizeRedirectLocation(response: Response): Response {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get('Location');
  if (!location) return response;
  try {
    const target = new URL(location, PUBLIC_ORIGIN);
    target.protocol = PUBLIC_ORIGIN.protocol;
    target.host = PUBLIC_ORIGIN.host;
    target.port = PUBLIC_ORIGIN.port;
    response.headers.set('Location', target.toString());
  } catch {
    // unparseable Location — leave it alone
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith('/admin');
  const isLoginPath = pathname.startsWith('/admin/login');
  const isApiPath = pathname.startsWith('/api');

  if (isAdminPath) {
    const hasSession = SESSION_COOKIE_NAMES.some((name) => request.cookies.get(name));

    if (!isLoginPath && !hasSession) {
      return NextResponse.redirect(new URL('/admin/login', PUBLIC_ORIGIN));
    }
    if (isLoginPath && hasSession) {
      return NextResponse.redirect(new URL('/admin', PUBLIC_ORIGIN));
    }
    return NextResponse.next();
  }

  if (isApiPath) {
    return NextResponse.next();
  }

  return normalizeRedirectLocation(intlMiddleware(request));
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};

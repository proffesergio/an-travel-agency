import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const nextAuthSecret = process.env.NEXTAUTH_SECRET;

        if (!adminEmail || !adminPassword) {
          console.error(
            '[auth] Missing admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD in your environment (.env.local in development, cPanel Node.js App env vars in production).'
          );
          return null;
        }

        if (!nextAuthSecret || nextAuthSecret.length < 32) {
          console.error(
            '[auth] NEXTAUTH_SECRET must be set to a random string of at least 32 characters. Generate one with: openssl rand -base64 32'
          );
          return null;
        }

        const email = typeof credentials?.email === 'string' ? credentials.email.trim() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) return null;
        if (email !== adminEmail || password !== adminPassword) return null;

        return { id: 'admin', name: 'Admin', email: adminEmail };
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        const { logActivity } = await import('@/lib/services/activity');
        await logActivity({
          action: 'login',
          entityType: 'user',
          actor: user.email ?? 'unknown',
          details: 'Admin signed in',
        });
      } catch {
        // Activity logging is best-effort; never block auth on it.
      }
    },
    async signOut(message) {
      try {
        const email =
          'token' in message && message.token && typeof message.token.email === 'string'
            ? message.token.email
            : 'unknown';
        const { logActivity } = await import('@/lib/services/activity');
        await logActivity({
          action: 'logout',
          entityType: 'user',
          actor: email,
          details: 'Admin signed out',
        });
      } catch {
        // best-effort
      }
    },
  },
});

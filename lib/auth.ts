import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword } from '@/lib/password';
import { normalizePhone } from '@/lib/validation/auth';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isGoogleEnabled = !!googleClientId && !!googleClientSecret;

const providers: NextAuthConfig['providers'] = [
  Credentials({
    id: 'credentials',
    name: 'Email or phone',
    credentials: {
      identifier: { label: 'Email or phone', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const identifier =
        typeof credentials?.identifier === 'string' ? credentials.identifier.trim() : '';
      const password =
        typeof credentials?.password === 'string' ? credentials.password : '';
      if (!identifier || !password) return null;

      // Admin fallback (legacy env-based admin)
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminEmail && adminPassword && identifier === adminEmail && password === adminPassword) {
        return { id: 'admin', name: 'Admin', email: adminEmail, role: 'admin' };
      }

      try {
        await connectDB();
        const isEmail = identifier.includes('@');
        const query = isEmail
          ? { email: identifier.toLowerCase() }
          : { phone: normalizePhone(identifier) };
        const user = await User.findOne(query);
        if (!user || !user.passwordHash) return null;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      } catch (err) {
        console.error('[auth] credentials authorize failed', err);
        return null;
      }
    },
  }),
];

if (isGoogleEnabled) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const isGoogleAuthEnabled = isGoogleEnabled;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Auto-provision user records on Google sign-in
      if (account?.provider === 'google' && profile?.email) {
        try {
          await connectDB();
          const existing = await User.findOne({ email: profile.email.toLowerCase() });
          if (!existing) {
            await User.create({
              name: profile.name ?? user.name ?? profile.email.split('@')[0],
              email: profile.email.toLowerCase(),
              phone: '',
              passwordHash: '',
              role: 'user',
              provider: 'google',
              emailVerified: new Date(),
            });
          }
        } catch (err) {
          console.error('[auth] google signIn provisioning failed', err);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = (token.role as string) ?? 'user';
      }
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
          details: `Signed in (${(user as { role?: string }).role ?? 'user'})`,
        });
      } catch {
        // best-effort
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
          details: 'Signed out',
        });
      } catch {
        // best-effort
      }
    },
  },
});

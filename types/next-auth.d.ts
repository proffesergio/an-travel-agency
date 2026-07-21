import type { DefaultSession } from 'next-auth';

/**
 * Module augmentation for next-auth (v5).
 *
 * `lib/auth.ts`'s `jwt`/`session` callbacks populate `role` from the
 * `User` document (`models/User.ts`: `role: 'user' | 'admin'`), or
 * `'admin'` for the legacy env-based admin fallback. This declares that
 * shape so `session.user.role` is typed everywhere instead of requiring
 * per-call-site casts.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'user' | 'admin';
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'user' | 'admin';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'user' | 'admin';
  }
}

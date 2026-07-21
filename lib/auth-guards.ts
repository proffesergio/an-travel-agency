import type { Session } from 'next-auth';

/**
 * The admin surface (app/admin) is gated on role, not just on having a
 * session — ordinary customers signing in via the same credentials
 * provider get `role: 'user'` (see `models/User.ts` and the `jwt`/
 * `session` callbacks in `lib/auth.ts`) and must not pass.
 *
 * `'admin'` is the only privileged role: `models/User.ts` declares
 * `role: { type: String, enum: ['user', 'admin'], default: 'user' }`,
 * and the legacy env-based admin fallback in `lib/auth.ts`'s
 * `authorize()` also returns `role: 'admin'`.
 *
 * This is a plain predicate rather than a throwing/redirecting helper:
 * call sites disagree on what to do when it's false (return a
 * serializable state, throw, or redirect), so unifying that control
 * flow would contort more than it would simplify. Every call site is
 * expected to do:
 *
 *   const session = await auth();
 *   if (!isAdminSession(session)) { ...site-specific rejection... }
 *
 * which also preserves the "no session -> rejected" behavior each site
 * already had, since a null session is never admin.
 */
export function isAdminSession(session: Session | null): session is Session {
  return session?.user?.role === 'admin';
}

'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/admin',
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return { error: 'Invalid email or password.' };
      }
      return { error: 'Authentication failed. Please try again.' };
    }
    // NextAuth performs the post-success redirect by throwing — let Next.js handle it.
    throw error;
  }
}

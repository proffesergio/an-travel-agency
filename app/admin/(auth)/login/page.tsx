'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { LogIn, Loader2 } from 'lucide-react';
import { loginAction, type LoginState } from './actions';

export default function AdminLoginPage() {
  const [state, formAction] = useActionState<LoginState | undefined, FormData>(loginAction, undefined);

  return (
    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
      <div className="text-center mb-8">
        <Image
          src="/ATHAR-NUR-Logo.png"
          alt="Athar Nur Travels"
          width={160}
          height={50}
          className="mx-auto h-12 w-auto mb-4"
          priority
        />
        <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
        <p className="text-gray-500 text-sm mt-1">Athar Nur Travels — Dashboard</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@atharnurtravels.com"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
          />
        </div>

        {state?.error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            {state.error}
          </div>
        )}

        <SubmitButton />
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Credentials are configured via environment variables.
          <br />
          Contact your administrator if you forgot your password.
        </p>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-full bg-[#2d6a4f] text-white font-bold hover:bg-[#1b4332] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4" />
          Sign In
        </>
      )}
    </button>
  );
}

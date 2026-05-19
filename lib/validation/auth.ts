import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(120),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone is required')
    .refine((v) => isValidBdPhone(v), {
      message: 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01700000000)',
    }),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Strip everything but digits and collapse to the local 10-digit form
 * (e.g. 1700000000). Returns null if the input isn't a BD mobile number.
 */
function toLocalBdMobile(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('880')) local = local.slice(3);
  else if (local.startsWith('0')) local = local.slice(1);
  // Local mobile: 10 digits starting with 1 then 3-9 (operator code)
  return /^1[3-9]\d{8}$/.test(local) ? local : null;
}

export function isValidBdPhone(value: string): boolean {
  return toLocalBdMobile(value) !== null;
}

/**
 * Normalise any user-entered BD phone to canonical "+8801XXXXXXXXX".
 * Falls back to the raw input (trimmed) if we can't recognise the format
 * so callers don't lose data on edge cases.
 */
export function normalizePhone(value: string): string {
  const local = toLocalBdMobile(value);
  if (local) return `+880${local}`;
  return value.trim();
}

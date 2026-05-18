import { z } from 'zod';

const bdPhoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(120),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone is required')
    .refine((v) => bdPhoneRegex.test(v.replace(/[\s-]/g, '')), {
      message: 'Enter a valid Bangladeshi phone number',
    }),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
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

export function normalizePhone(value: string): string {
  const cleaned = value.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('880')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+88${cleaned}`;
  return `+88${cleaned}`;
}

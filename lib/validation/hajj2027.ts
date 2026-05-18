import { z } from 'zod';

const bdPhoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;

export const hajj2027RegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(120),
  nameBn: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone is required')
    .refine((v) => bdPhoneRegex.test(v.replace(/[\s-]/g, '')), {
      message: 'Enter a valid Bangladeshi phone number',
    }),
  email: z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
  nidNumber: z.string().trim().min(5, 'NID number is required').max(40),
  passportNumber: z.string().trim().max(40).optional().or(z.literal('')),
  dateOfBirth: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  packageType: z.enum(['economy', 'standard', 'premium', 'undecided']).default('undecided'),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type Hajj2027Registration = z.infer<typeof hajj2027RegistrationSchema>;

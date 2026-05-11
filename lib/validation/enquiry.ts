import { z } from 'zod';

const bdPhoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;

export const enquiryInputSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(120),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone is required')
    .refine((v) => bdPhoneRegex.test(v.replace(/[\s-]/g, '')), {
      message: 'Enter a valid Bangladeshi phone number',
    }),
  email: z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
  category: z.enum(['hajj', 'umrah', 'tour', 'air-ticketing', 'general']).default('general'),
  packageId: z.string().optional(),
  packageTitle: z.string().optional(),
  passengers: z.coerce.number().int().positive().max(50).default(1),
  message: z.string().max(2000).default(''),
});

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export const enquiryStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']),
});

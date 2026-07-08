import { z } from 'zod';
import { isValidBdPhone } from './auth';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const enquiryInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name').max(120),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone is required')
      .refine((v) => isValidBdPhone(v), {
        message: 'Enter a valid Bangladeshi phone number',
      }),
    email: z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
    category: z
      .enum(['hajj', 'umrah', 'tour', 'air-ticketing', 'hotel', 'general'])
      .default('general'),
    packageId: z.string().optional(),
    packageTitle: z.string().optional(),
    passengers: z.coerce.number().int().positive().max(50).default(1),
    message: z.string().max(2000).default(''),
    // Hotel booking fields
    hotelId: z.string().optional(),
    hotelName: z.string().max(200).optional(),
    roomType: z.string().max(120).optional(),
    checkIn: z.string().regex(ISO_DATE, 'Invalid check-in date').optional(),
    checkOut: z.string().regex(ISO_DATE, 'Invalid check-out date').optional(),
    roomsCount: z.coerce.number().int().min(1).max(20).optional(),
    guests: z
      .object({
        adults: z.coerce.number().int().min(1).max(40),
        children: z.coerce.number().int().min(0).max(40).default(0),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category !== 'hotel') return;
    if (!data.hotelId || !data.hotelName) {
      ctx.addIssue({ code: 'custom', path: ['hotelId'], message: 'Hotel is required' });
    }
    if (!data.checkIn) {
      ctx.addIssue({ code: 'custom', path: ['checkIn'], message: 'Check-in date is required' });
    }
    if (!data.checkOut) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'Check-out date is required' });
    }
    if (data.checkIn && data.checkOut && data.checkOut <= data.checkIn) {
      ctx.addIssue({
        code: 'custom',
        path: ['checkOut'],
        message: 'Check-out must be after check-in',
      });
    }
  });

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export const enquiryStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']),
});

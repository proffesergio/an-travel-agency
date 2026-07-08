import { z } from 'zod';
import { AMENITY_KEYS, HOTEL_CURRENCIES } from '@/lib/hotels-shared';

const roomTypeSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(120),
  nameBn: z.string().min(1, 'Bengali room name is required').max(120),
  pricePerNight: z
    .number({ message: 'Price per night is required' })
    .positive('Price must be greater than 0'),
  capacity: z.object({
    adults: z.number().int().min(1, 'At least 1 adult').max(20),
    children: z.number().int().min(0).max(20).default(0),
  }),
  bedInfo: z.string().max(120).optional(),
  images: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});

export const hotelInputSchema = z.object({
  name: z.string().min(1, 'Hotel name is required').max(200),
  nameBn: z.string().min(1, 'Bengali hotel name is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphen-separated'),
  city: z.string().min(1, 'City is required').max(100),
  cityBn: z.string().min(1, 'Bengali city is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  countryBn: z.string().min(1, 'Bengali country is required').max(100),
  starRating: z.number().int().min(1).max(5),
  distanceFromHaramMeters: z.number().int().positive().optional(),
  description: z.string().min(1, 'Description is required'),
  descriptionBn: z.string().min(1, 'Bengali description is required'),
  amenities: z.array(z.enum(AMENITY_KEYS)).default([]),
  images: z.array(z.string()).default([]),
  currency: z.enum(HOTEL_CURRENCIES).default('BDT'),
  featured: z.boolean().default(false),
  available: z.boolean().default(true),
  rooms: z.array(roomTypeSchema).min(1, 'Add at least one room type'),
});

export type HotelInput = z.infer<typeof hotelInputSchema>;

export const hotelUpdateSchema = hotelInputSchema.partial();
export type HotelUpdate = z.infer<typeof hotelUpdateSchema>;

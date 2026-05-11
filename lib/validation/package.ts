import { z } from 'zod';

const itineraryDaySchema = z.object({
  day: z.string().min(1, 'Day label is required'),
  title: z.string().min(1, 'Day title is required'),
  description: z.string().default(''),
});

export const packageInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  titleBn: z.string().min(1, 'Bengali title is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphen-separated'),
  category: z.enum(['hajj', 'umrah', 'tour']),
  price: z.number({ message: 'Price is required' }).positive('Price must be greater than 0'),
  currency: z.string().min(1).default('BDT'),
  duration: z.string().min(1, 'Duration is required'),
  durationBn: z.string().min(1, 'Bengali duration is required'),
  description: z.string().min(1, 'Description is required'),
  descriptionBn: z.string().min(1, 'Bengali description is required'),
  inclusions: z.array(z.string().trim().min(1)).min(1, 'Add at least one inclusion'),
  inclusionsBn: z.array(z.string().trim().min(1)).default([]),
  itinerary: z.array(itineraryDaySchema).min(1, 'Add at least one itinerary day'),
  imageUrl: z.string().default('/images/placeholder-package.jpg'),
  featured: z.boolean().default(false),
  available: z.boolean().default(true),
});

export type PackageInput = z.infer<typeof packageInputSchema>;

export const packageUpdateSchema = packageInputSchema.partial();
export type PackageUpdate = z.infer<typeof packageUpdateSchema>;

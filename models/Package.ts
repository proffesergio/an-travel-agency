import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPackage extends Document {
  title: string;
  titleBn: string;
  slug: string;
  category: 'hajj' | 'umrah' | 'tour';
  price: number;
  currency: string;
  duration: string;
  durationBn: string;
  description: string;
  descriptionBn: string;
  inclusions: string[];
  inclusionsBn: string[];
  itinerary: { day: string; title: string; description: string }[];
  imageUrl: string;
  featured: boolean;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    title: { type: String, required: true },
    titleBn: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    category: { type: String, enum: ['hajj', 'umrah', 'tour'], required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    duration: { type: String, required: true },
    durationBn: { type: String, default: '' },
    description: { type: String, default: '' },
    descriptionBn: { type: String, default: '' },
    inclusions: [{ type: String }],
    inclusionsBn: [{ type: String }],
    itinerary: [
      {
        day: String,
        title: String,
        description: String,
      },
    ],
    imageUrl: { type: String, default: '/images/placeholder-package.jpg' },
    featured: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Package: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);

export default Package;

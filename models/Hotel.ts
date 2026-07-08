import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoomType {
  name: string;
  nameBn: string;
  pricePerNight: number;
  capacity: { adults: number; children: number };
  bedInfo?: string;
  images: string[];
  available: boolean;
}

export interface IHotel extends Document {
  name: string;
  nameBn: string;
  slug: string;
  city: string;
  cityBn: string;
  country: string;
  countryBn: string;
  starRating: number;
  distanceFromHaramMeters?: number;
  description: string;
  descriptionBn: string;
  amenities: string[];
  images: string[];
  currency: string;
  featured: boolean;
  available: boolean;
  rooms: IRoomType[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>(
  {
    name: { type: String, required: true },
    nameBn: { type: String, default: '' },
    pricePerNight: { type: Number, required: true },
    capacity: {
      adults: { type: Number, required: true, default: 2 },
      children: { type: Number, required: true, default: 0 },
    },
    bedInfo: { type: String },
    images: [{ type: String }],
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const HotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true },
    nameBn: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    city: { type: String, required: true, index: true },
    cityBn: { type: String, default: '' },
    country: { type: String, required: true },
    countryBn: { type: String, default: '' },
    starRating: { type: Number, required: true, min: 1, max: 5, default: 3 },
    distanceFromHaramMeters: { type: Number },
    description: { type: String, default: '' },
    descriptionBn: { type: String, default: '' },
    amenities: [{ type: String }],
    images: [{ type: String }],
    currency: { type: String, default: 'BDT' },
    featured: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    rooms: { type: [RoomTypeSchema], default: [] },
  },
  { timestamps: true }
);

const Hotel: Model<IHotel> =
  mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);

export default Hotel;

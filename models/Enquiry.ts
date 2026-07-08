import mongoose, { Schema, Document, Model } from 'mongoose';

/** Uploaded identity/booking documents (Cloudinary secure URLs). */
export interface IEnquiryDocuments {
  passportImage?: string;
  nidImage?: string;
  photoImage?: string;
}

export interface IEnquiry extends Document {
  name: string;
  nameBn?: string;
  email: string;
  phone: string;
  packageId?: string;
  packageTitle?: string;
  category: 'hajj' | 'umrah' | 'tour' | 'air-ticketing' | 'hotel' | 'general';
  passengers?: number;
  /** Hotel booking fields (category === 'hotel'). */
  hotelId?: string;
  hotelName?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  roomsCount?: number;
  guests?: { adults: number; children: number };
  message: string;
  /** Structured applicant identity captured during booking. */
  nidNumber?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  address?: string;
  documents?: IEnquiryDocuments;
  status: 'new' | 'contacted' | 'closed';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentMethod?: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'card' | 'cash' | 'piprapay' | 'sslcommerz';
  paymentAmount?: number;
  paymentReference?: string;
  transactionId?: string;
  /** Timestamp the payment was confirmed (paid). */
  paidAt?: Date;
  /** PipraPay charge id (pp_id) returned by create-charge; links webhook → enquiry. */
  ppId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    name: { type: String, required: true },
    nameBn: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    packageId: { type: String },
    packageTitle: { type: String },
    category: {
      type: String,
      enum: ['hajj', 'umrah', 'tour', 'air-ticketing', 'hotel', 'general'],
      default: 'general',
    },
    passengers: { type: Number, default: 1 },
    hotelId: { type: String },
    hotelName: { type: String },
    roomType: { type: String },
    checkIn: { type: String },
    checkOut: { type: String },
    roomsCount: { type: Number },
    guests: {
      adults: { type: Number },
      children: { type: Number },
    },
    message: { type: String, default: '' },
    nidNumber: { type: String },
    passportNumber: { type: String },
    dateOfBirth: { type: String },
    address: { type: String },
    documents: {
      passportImage: { type: String },
      nidImage: { type: String },
      photoImage: { type: String },
    },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'] },
    paymentMethod: {
      type: String,
      enum: ['bkash', 'nagad', 'rocket', 'bank', 'card', 'cash', 'piprapay', 'sslcommerz'],
    },
    paymentAmount: { type: Number },
    paymentReference: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date },
    ppId: { type: String, index: true },
  },
  { timestamps: true }
);

const Enquiry: Model<IEnquiry> =
  mongoose.models.Enquiry || mongoose.model<IEnquiry>('Enquiry', EnquirySchema);

export default Enquiry;

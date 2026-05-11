import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEnquiry extends Document {
  name: string;
  email: string;
  phone: string;
  packageId?: string;
  packageTitle?: string;
  category: 'hajj' | 'umrah' | 'tour' | 'air-ticketing' | 'general';
  passengers?: number;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    packageId: { type: String },
    packageTitle: { type: String },
    category: {
      type: String,
      enum: ['hajj', 'umrah', 'tour', 'air-ticketing', 'general'],
      default: 'general',
    },
    passengers: { type: Number, default: 1 },
    message: { type: String, default: '' },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'] },
    transactionId: { type: String },
  },
  { timestamps: true }
);

const Enquiry: Model<IEnquiry> =
  mongoose.models.Enquiry || mongoose.model<IEnquiry>('Enquiry', EnquirySchema);

export default Enquiry;

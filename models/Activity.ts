import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  action: string;
  entityType: 'package' | 'hotel' | 'enquiry' | 'settings' | 'user';
  entityId?: string;
  entityName?: string;
  adminEmail: string;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'login', 'logout', 'view', 'export'],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['package', 'hotel', 'enquiry', 'settings', 'user'],
    },
    entityId: { type: String },
    entityName: { type: String },
    adminEmail: { type: String, required: true },
    details: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ adminEmail: 1 });
ActivitySchema.index({ entityType: 1, entityId: 1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;

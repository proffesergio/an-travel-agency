import mongoose, { Schema, Model } from 'mongoose';
import type { SiteSettingsData } from '@/lib/site-settings-shared';
import { SOCIAL_PLATFORMS, NOTICE_PLACEMENTS } from '@/lib/site-settings-shared';

export interface ISiteSettings extends SiteSettingsData {
  _id: string;
  updatedAt: Date;
  updatedBy: string;
}

const localizedSchema = new Schema(
  {
    en: { type: String, default: '' },
    bn: { type: String, default: '' },
    ar: { type: String, default: '' },
  },
  { _id: false }
);

const phoneSchema = new Schema(
  {
    number: { type: String, default: '' },
    tel: { type: String, default: '' },
    countryCode: { type: String, default: '' },
    flag: { type: String, default: '' },
    country: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const officeSchema = new Schema(
  {
    label: { type: localizedSchema, default: () => ({}) },
    address: { type: localizedSchema, default: () => ({}) },
    phone: { type: String, default: '' },
    mapUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const socialSchema = new Schema(
  {
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    url: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    name: { type: String, default: '' },
    label: { type: String, default: '' },
    sub: { type: String, default: '' },
    bg: { type: String, default: '#ffffff' },
    text: { type: String, default: '#000000' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// brand/contact/notice/footer/seo are each their own Schema (rather than a raw
// nested object literal) so that `default: undefined` on the parent path
// actually suppresses the whole subtree. A raw nested-object path in Mongoose
// has no single "is this section set" switch — every leaf field applies its
// own default the moment the document is instantiated, so an untouched
// section would materialize as `{ companyName: '', logoUrl: '', ... }`
// instead of staying absent. That would make mergeSiteSettings see explicit
// empty strings and overwrite DEFAULT_SITE_SETTINGS with blanks. Wrapping the
// section in a Schema restores the same "absent until saved" behavior already
// used for the array fields below.
const brandSchema = new Schema(
  {
    companyName: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    ogImageUrl: { type: String, default: '' },
  },
  { _id: false }
);

const contactSchema = new Schema(
  {
    email: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    phones: { type: [phoneSchema], default: undefined },
  },
  { _id: false }
);

const noticeSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    text: { type: localizedSchema, default: () => ({}) },
    linkUrl: { type: String, default: '' },
    placements: { type: [String], enum: NOTICE_PLACEMENTS, default: undefined },
    startsAt: { type: String, default: '' },
    endsAt: { type: String, default: '' },
  },
  { _id: false }
);

const footerSchema = new Schema(
  {
    tagline: { type: localizedSchema, default: () => ({}) },
    paymentNote: { type: localizedSchema, default: () => ({}) },
    rights: { type: localizedSchema, default: () => ({}) },
    badgeLine: { type: localizedSchema, default: () => ({}) },
  },
  { _id: false }
);

const seoSchema = new Schema(
  {
    title: { type: localizedSchema, default: () => ({}) },
    description: { type: localizedSchema, default: () => ({}) },
  },
  { _id: false }
);

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    _id: { type: String, required: true },
    brand: { type: brandSchema, default: undefined },
    contact: { type: contactSchema, default: undefined },
    offices: { type: [officeSchema], default: undefined },
    socials: { type: [socialSchema], default: undefined },
    payments: { type: [paymentSchema], default: undefined },
    notice: { type: noticeSchema, default: undefined },
    footer: { type: footerSchema, default: undefined },
    seo: { type: seoSchema, default: undefined },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true, _id: false, minimize: false }
);

const SiteSettings: Model<ISiteSettings> =
  (mongoose.models.SiteSettings as Model<ISiteSettings>) ||
  mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);

export default SiteSettings;

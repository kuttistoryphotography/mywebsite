import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface IContactSettings extends Document {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  googleMapsEmbed: string;
  businessHours: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  updatedAt: Date;
}

const ContactSettingsSchema = new Schema<IContactSettings>(
  {
    email:        { type: String, default: 'kuttistoryphotography@gmail.com' },
    phone:        { type: String, default: '+91 82489 51574' },
    whatsapp:     { type: String, default: '+91 82489 51574' },
    address:      { type: String, default: 'Periyar' },
    city:         { type: String, default: 'Madurai' },
    state:        { type: String, default: 'Tamil Nadu' },
    pincode:      { type: String, default: '625016' },
    googleMapsEmbed: { type: String, default: '' },
    businessHours:{ type: String, default: 'Mon – Sat: 9 AM – 7 PM' },
    instagramUrl: { type: String, default: '' },
    facebookUrl:  { type: String, default: '' },
    youtubeUrl:   { type: String, default: '' },
    twitterUrl:   { type: String, default: '' },
    telegramUrl:  { type: String, default: '' },
  },
  { timestamps: true }
);

const ContactSettings: Model<IContactSettings> =
  mongoose.models.ContactSettings ||
  mongoose.model<IContactSettings>('ContactSettings', ContactSettingsSchema);

export default ContactSettings;
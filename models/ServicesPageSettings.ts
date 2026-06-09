import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IServicesPageSettings extends Document {
  hero: {
    heading: string;
    subheading: string;
    paragraph: string;
    heroImage: string;
    heroImageType: string;
    heroVideo: string;
    heroVideoType: string;
  };
  showcase: {
    heading: string;
    subheading: string;
    description: string;
  };
  cardGrid: {
    whatsappCardTitle: string;
    whatsappCardPlaceholder: string;
    storytellingCardTitle: string;
    storytellingCardDescription: string;
    storytellingCardImage: string;
    storytellingCardImageType: string;
    storytellingCardLearnMoreLink: string;
    expertCardTitle: string;
    expertCount: string;
    expertCardTagline: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const ServicesPageSettingsSchema = new Schema<IServicesPageSettings>(
  {
    hero: {
      heading:       { type: String, default: 'Moments Over Matter — Motion in Time' },
      subheading:    { type: String, default: 'Our Services' },
      paragraph:     { type: String, default: 'At Kutti Story, we act as your catalyst for profound memories.' },
      heroImage:     { type: String, default: '' },
      heroImageType: { type: String, default: 'image' },
      heroVideo:     { type: String, default: '' },
      heroVideoType: { type: String, default: 'video' },
    },
    showcase: {
      heading:     { type: String, default: 'Our Services' },
      subheading:  { type: String, default: 'What We Offer' },
      description: { type: String, default: 'Every frame tells a story. Discover our range of photography services.' },
    },
    cardGrid: {
      whatsappCardTitle:              { type: String, default: 'Guidance you can trust' },
      whatsappCardPlaceholder:        { type: String, default: 'Ask us anything...' },
      storytellingCardTitle:          { type: String, default: 'Candid Storytelling' },
      storytellingCardDescription:    { type: String, default: 'Starting your journey of memories today.' },
      storytellingCardImage:          { type: String, default: '' },
      storytellingCardImageType:      { type: String, default: 'image' },
      storytellingCardLearnMoreLink:  { type: String, default: '/works' },
      expertCardTitle:                { type: String, default: 'A New Dimension of Wellness' },
      expertCount:                    { type: String, default: '52+' },
      expertCardTagline:              { type: String, default: 'join with us' },
    },
  },
  { timestamps: true }
);

// Prevent stale cached model during Next.js dev hot-reload
delete (mongoose.models as any).ServicesPageSettings;

const ServicesPageSettings: Model<IServicesPageSettings> =
  mongoose.model<IServicesPageSettings>('ServicesPageSettings', ServicesPageSettingsSchema);

export default ServicesPageSettings;
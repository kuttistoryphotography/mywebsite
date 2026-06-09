import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFaqItem {
  question: string;
  answer: string;
}

export interface IFaqCategory {
  category: string;
  items: IFaqItem[];
}

export interface IFaqSettings extends Document {
  heading: string;
  subheading: string;
  description: string;
  categories: IFaqCategory[];
  updatedAt: Date;
}

const FaqItemSchema = new Schema<IFaqItem>(
  {
    question: { type: String, default: '' },
    answer:   { type: String, default: '' },
  },
  { _id: false }
);

const FaqCategorySchema = new Schema<IFaqCategory>(
  {
    category: { type: String, default: '' },
    items:    { type: [FaqItemSchema], default: [] },
  },
  { _id: false }
);

const FaqSettingsSchema = new Schema<IFaqSettings>(
  {
    heading:    { type: String, default: 'Frequently Asked Questions' },
    subheading: { type: String, default: 'FAQs' },
    description:{ type: String, default: 'Everything you need to know about our photography services.' },
    categories: {
      type: [FaqCategorySchema],
      default: [
        {
          category: 'Wedding Photography',
          items: [
            { question: 'What is included in your wedding photography package?', answer: 'Our wedding photography packages include candid photography, traditional photography, couple portraits, group photos, and full-event coverage. You also receive professionally edited images and an optional premium album.' },
            { question: 'How early should we book for our wedding date?',        answer: 'We recommend booking at least 2–3 months in advance because popular dates fill up quickly, especially during the wedding season in Madurai.' },
            { question: 'Do you provide candid wedding photography?',            answer: 'Yes. We specialise in artistic and cinematic candid wedding photography that captures emotions, expressions, and natural moments beautifully.' },
            { question: 'How many edited photos will we receive?',               answer: 'The number varies depending on your package, but typically between 350–700 fully edited high-resolution images.' },
            { question: 'Will there be a backup team available?',                answer: 'Absolutely. We always have backup photographers and videographers ready for unforeseen situations.' },
            { question: 'Do you travel for outstation weddings?',                answer: 'Yes, we cover weddings across Tamil Nadu and India. Travel and accommodation charges apply based on the location.' },
          ],
        },
        {
          category: 'Baby Photography',
          items: [
            { question: 'Do you provide props and costumes?', answer: 'Yes. We have a curated collection of safe, hygienic, and theme-based baby costumes, wraps, and props.' },
          ],
        },
        {
          category: 'Videography Services',
          items: [
            { question: 'Do you provide candid wedding videography?', answer: 'Yes. We specialise in cinematic wedding videography that captures emotions and natural moments beautifully.' },
            { question: 'How many edited videos will we receive?',     answer: 'The number varies depending on your package and event duration.' },
          ],
        },
        {
          category: 'Album & Delivery',
          items: [
            { question: 'When will we receive our photos?',  answer: 'Edited photos are delivered within 3–4 weeks after the event, depending on the package.' },
            { question: 'What album options are available?', answer: 'We offer premium flush-mount albums, canvas prints, and digital delivery via a private online gallery.' },
          ],
        },
      ],
    },
  },
  { timestamps: true }
);

delete (mongoose.models as any).FaqSettings;

const FaqSettings: Model<IFaqSettings> =
  mongoose.model<IFaqSettings>('FaqSettings', FaqSettingsSchema);

export default FaqSettings;
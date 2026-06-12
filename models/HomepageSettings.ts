import mongoose, { Document, Model, Schema } from 'mongoose';

// Hero section
export interface IHeroSection {
  backgroundImage: string;
  heading: string;
  subheading: string;
  paragraph: string;
  badgeText: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  statsYears: string;
  statsStories: string;
  statsPassion: string;
  heroCardImage: string;
  awardText: string;
}

// Individual image slot
export interface IHomeImageSlot {
  key: string;          // e.g. "about_main", "featured_big", etc.
  label: string;
  url: string;
}

// Carousel/Showcase slide (WeddingShowcase)
export interface IShowcaseSlide {
  image1: string;
  image2: string;
  year: string;
}

// Stories strip image
export interface IStoryImage {
  src: string;
  alt: string;
}

export interface IHomepageSettings extends Document {
  hero: IHeroSection;
  homeImages: IHomeImageSlot[];
  showcaseSlides: IShowcaseSlide[];
  storyImages: IStoryImage[];

  aboutContent: {
    title: string;
    heading: string;
    description: string;
  };

  updatedAt: Date;
}

const HomepageSettingsSchema = new Schema<IHomepageSettings>(
  {
    hero: {
      backgroundImage: { type: String, default: '' },
      heading: { type: String, default: 'Capturing Moments Into Eternity' },
      subheading: { type: String, default: 'Kutti Story Photography' },
      paragraph: { type: String, default: "We don't just take pictures; we craft visual legacies." },
      badgeText: { type: String, default: 'Kutti Story Photography' },
      primaryButtonText: { type: String, default: 'Book a Session' },
      secondaryButtonText: { type: String, default: 'View Portfolio' },
      statsYears: { type: String, default: '7+' },
      statsStories: { type: String, default: '213+' },
      statsPassion: { type: String, default: '100%' },
      heroCardImage: { type: String, default: '' },
      awardText: { type: String, default: 'Award Winning Studio 2024' },
    },
    homeImages: [
      {
        key: String,
        label: String,
        url: String,
      },
    ],
    showcaseSlides: [
      {
        image1: String,
        image2: String,
        year: String,
      },
    ],
   storyImages: [
  {
    src: String,
    alt: String,
  },
],

aboutContent: {
  title: {
    type: String,
    default: 'About Kutti Story',
  },
  heading: {
    type: String,
    default: 'We Make Only Authentic Visual Experiences',
  },
  description: {
    type: String,
    default:
      'Every frame we create is driven by emotion, story, and authenticity.',
  },
},
  },
  
  { timestamps: true }
);

const HomepageSettings: Model<IHomepageSettings> =
  mongoose.models.HomepageSettings ||
  mongoose.model<IHomepageSettings>('HomepageSettings', HomepageSettingsSchema);

export default HomepageSettings;

import mongoose, { Document, Model, Schema } from 'mongoose';

// Hero section
export interface IHeroSection {
  backgroundImage: string;
  backgroundMediaType: string;

  backgroundOpacity: number;
  backgroundBlur: number;
  backgroundBrightness: number;
  overlayOpacity: number;

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
  heroCardMediaType: string;

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

export interface ISiteSettings {
  logo: string;
}

export interface IHomepageSettings extends Document {
  hero: IHeroSection;
  homeImages: IHomeImageSlot[];
  showcaseSlides: IShowcaseSlide[];
  storyImages: IStoryImage[];
  siteSettings: ISiteSettings;

  aboutContent: {
    title: string;
    heading: string;
    description: string;
    experienceBadge: string;

  };

  updatedAt: Date;
}

const HomepageSettingsSchema = new Schema<IHomepageSettings>(
  {
  hero: {
  backgroundImage: { type: String, default: "" },

  backgroundMediaType: {
    type: String,
    default: "image",
  },

  backgroundOpacity: {
    type: Number,
    default: 100,
  },

  backgroundBlur: {
    type: Number,
    default: 0,
  },

  backgroundBrightness: {
    type: Number,
    default: 100,
  },

  overlayOpacity: {
    type: Number,
    default: 20,
  },

  heading: { type: String, default: "Capturing Moments Into Eternity" },
  subheading: { type: String, default: "Kutti Story Photography" },
  paragraph: {
    type: String,
    default: "We don't just take pictures; we craft visual legacies.",
  },

  badgeText: { type: String, default: "Kutti Story Photography" },
  primaryButtonText: { type: String, default: "Book a Session" },
  secondaryButtonText: { type: String, default: "View Portfolio" },

  statsYears: { type: String, default: "7+" },
  statsStories: { type: String, default: "213+" },
  statsPassion: { type: String, default: "100%" },

  heroCardImage: { type: String, default: "" },

  heroCardMediaType: {
    type: String,
    default: "image",
  },

  awardText: {
    type: String,
    default: "Award Winning Studio 2024",
  },
},
    siteSettings: {
      logo: {
        type: String,
        default: "/placeholder-logo.png",
      },
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
    default: 'Every frame we create is driven by emotion, story, and authenticity.',
  },
  experienceBadge: {
    type: String,
    default: '10+ Years Experience',
  },
},
  },
  
  { timestamps: true }
);



delete (mongoose.models as any).HomepageSettings;

const HomepageSettings: Model<IHomepageSettings> =
  mongoose.model<IHomepageSettings>(
    "HomepageSettings",
    HomepageSettingsSchema
  );

export default HomepageSettings;
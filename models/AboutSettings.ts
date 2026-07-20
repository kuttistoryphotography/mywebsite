import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITeamMember {
  name: string;
  role: string;
  image: string;
}

export interface ITimelineEntry {
  id: string;
  year: string;
  title: string;
  text: string;
  image: string;
}

export interface IAboutSettings extends Document {
  hero: {
    heading: string;
    subheading: string;
    paragraph: string;
    highlightWord: string;
    images: string[];
    profileImage: string;
    profileName: string;
    profileRole: string;
  };
  story: {
  heading: string;
  paragraph: string;

  image: string;

  galleryImages: string[];

  coverImage: string;

  rightImage: string;

  videoUrl: string;
};
  team: ITeamMember[];
  timeline: ITimelineEntry[];
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name:  { type: String, default: '' },
    role:  { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    id:    { type: String, default: '' },
    year:  { type: String, default: '' },
    title: { type: String, default: '' },
    text:  { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const AboutSettingsSchema = new Schema<IAboutSettings>(
  {
    hero: {
      heading:       { type: String, default: 'Capturing the Silent Stories in Every Frame...' },
      subheading:    { type: String, default: 'We specialize in outdoor night shoots and cinematic storytelling.' },
      paragraph:     { type: String, default: 'Bringing out the soul of every moment.' },
      highlightWord: { type: String, default: 'Silent Stories' },
      images:        { type: [String], default: [] },
      profileImage:  { type: String, default: '' },
      profileName: {
        type: String,
        default: 'Kutti Story Photography',
      },

      profileRole: {
        type: String,
        default: 'Wedding Photographer & Cinematographer',
      },
    story: {
  heading: {
    type: String,
    default: "Behind the Lens",
  },

  paragraph: {
    type: String,
    default: "Our night sessions showcase natural light and ambient night aesthetics.",
  },

  image: {
    type: String,
    default: "",
  },

  galleryImages: {
    type: [String],
    default: ["", "", "", ""],
  },

  coverImage: {
    type: String,
    default: "",
  },

  rightImage: {
    type: String,
    default: "",
  },

  videoUrl: {
    type: String,
    default: "",
  },
},
    team: {
      type: [TeamMemberSchema],
      default: [],
    },

    timeline: {
      type: [TimelineEntrySchema],
      default: [
        { id: 'vision',      year: '2025', title: 'The Modern Era',        text: 'Innovation meets emotion. Using AI-enhanced workflows to deliver timeless quality.',    image: '' },
        { id: 'legacy',      year: '2024', title: 'Legacy Building',       text: 'Introducing premium cinematic films alongside our award-winning photography.',         image: '' },
        { id: 'foundation',  year: '2023', title: 'Foundation & Growth',   text: 'Building Kutti Story Photography with a strong focus on quality and client trust.',    image: '' },
        { id: 'creative',    year: '2022', title: 'Creative Pursuits',     text: 'Exploring advanced lighting, composition, and storytelling techniques.',               image: '' },
        { id: 'inspiration', year: '2020', title: 'Early Inspirations',    text: 'Developing a deep passion for capturing real emotions and timeless moments.',         image: '' },
        { id: 'mastery',     year: '2019', title: 'Technical Mastery',     text: 'Mastering camera systems, lighting science, and post-processing workflows.',          image: '' },
        { id: 'spark',       year: '2018', title: 'The First Spark',       text: 'The moment a hobby transformed into a lifelong pursuit of visual excellence.',        image: '' },
      ],
    },
  },
  { timestamps: true }
);

// Clear cached model in dev hot-reload to avoid "Cannot overwrite model" errors
delete (mongoose.models as any).AboutSettings;

const AboutSettings: Model<IAboutSettings> =
  mongoose.model<IAboutSettings>('AboutSettings', AboutSettingsSchema);

export default AboutSettings;
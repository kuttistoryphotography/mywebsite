
import mongoose, { Document, Model, Schema } from "mongoose";


export type QuotationSectionType =
  | "hero"
  | "story"
  | "gallery"
  | "event"
  | "services"
  | "deliverables"
  | "pricing"
  | "payment_terms"
  | "terms"
  | "closing"
  | "custom";

export interface IQuotationImage {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface IQuotationPageSection {
  id: string;
  type: QuotationSectionType;
  visible: boolean;
  title?: string;
  subtitle?: string;
  body?: string;
  layout?: string;
  backgroundColor?: string;
  textColor?: string;
  images: IQuotationImage[];
}

export interface IQuotationPageDesign {
  brandName: string;
  tagline: string;
  logoUrl?: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  sections: IQuotationPageSection[];
}

export interface IQuotationEvent {
  eventName: string;
  eventDate?: Date;
  venue?: string;
  services: {
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface IQuotationProposal extends Document {
  quoteNumber: string;
  publicToken: string;
  linkRevoked: boolean;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;

  title: string;
  introduction?: string;

  // Editable visual quotation page
  pageDesign: IQuotationPageDesign;

  events: IQuotationEvent[];

  deliverables: string[];
  subtotal: number;
  discount: number;
  totalAmount: number;

  paymentTerms: {
    label: string;
    percentage?: number;
    amount?: number;
    dueDate?: Date;
  }[];

  termsAndConditions: string[];
  validityDate?: Date;

  status: "draft" | "published" | "accepted" | "expired";
  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}


const QuotationImageSchema = new Schema<IQuotationImage>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: "" },
    caption: { type: String, trim: true, default: "" },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
  },
  { _id: false }
);

const QuotationPageSectionSchema = new Schema<IQuotationPageSection>(
  {
    id: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "hero",
        "story",
        "gallery",
        "event",
        "services",
        "deliverables",
        "pricing",
        "payment_terms",
        "terms",
        "closing",
        "custom",
      ],
      required: true,
    },
    visible: { type: Boolean, default: true },
    title: { type: String, trim: true, default: "" },
    subtitle: { type: String, trim: true, default: "" },
    body: { type: String, trim: true, default: "" },
    layout: { type: String, trim: true, default: "default" },
    backgroundColor: { type: String, trim: true, default: "" },
    textColor: { type: String, trim: true, default: "" },
    images: { type: [QuotationImageSchema], default: [] },
  },
  { _id: false }
);

const QuotationPageDesignSchema = new Schema<IQuotationPageDesign>(
  {
    brandName: {
      type: String,
      trim: true,
      default: "Kutti Story Photography",
    },
    tagline: {
      type: String,
      trim: true,
      default: "Capturing Life, One Story at a Time.",
    },
    logoUrl: { type: String, trim: true, default: "" },
    backgroundColor: { type: String, default: "#f5f1e9" },
    accentColor: { type: String, default: "#c6a66b" },
    textColor: { type: String, default: "#242424" },
    fontFamily: { type: String, default: "serif" },
    sections: { type: [QuotationPageSectionSchema], default: [] },
  },
  { _id: false }
);

const QuotationEventSchema = new Schema<IQuotationEvent>(
  {
    eventName: { type: String, required: true, trim: true },
    eventDate: Date,
    venue: { type: String, trim: true },
    services: [
      {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { _id: true }
);

const QuotationProposalSchema = new Schema<IQuotationProposal>(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    publicToken: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    linkRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, trim: true, lowercase: true },
    clientPhone: { type: String, trim: true },

    title: { type: String, required: true, trim: true },
    introduction: { type: String, trim: true },

    pageDesign: {
      type: QuotationPageDesignSchema,
      default: () => ({
        brandName: "Kutti Story Photography",
        tagline: "Capturing Life, One Story at a Time.",
        backgroundColor: "#f5f1e9",
        accentColor: "#c6a66b",
        textColor: "#242424",
        fontFamily: "serif",
        sections: [],
      }),
    },

    events: { type: [QuotationEventSchema], default: [] },

    deliverables: { type: [String], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },

    paymentTerms: [
      {
        label: { type: String, required: true, trim: true },
        percentage: { type: Number, min: 0, max: 100 },
        amount: { type: Number, min: 0 },
        dueDate: Date,
      },
    ],

    termsAndConditions: { type: [String], default: [] },
    validityDate: Date,

    status: {
      type: String,
      enum: ["draft", "published", "accepted", "expired"],
      default: "draft",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

QuotationProposalSchema.index({ status: 1, createdAt: -1 });
QuotationProposalSchema.index({ clientEmail: 1 });

const QuotationProposal: Model<IQuotationProposal> =
  mongoose.models.QuotationProposal ||
  mongoose.model<IQuotationProposal>(
    "QuotationProposal",
    QuotationProposalSchema
  );

export default QuotationProposal;

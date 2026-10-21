
import mongoose, { Document, Model, Schema } from "mongoose";

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

  clientName: string;
  clientEmail: string;
  clientPhone?: string;

  title: string;
  introduction?: string;
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

    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, trim: true, lowercase: true },
    clientPhone: { type: String, trim: true },

    title: { type: String, required: true, trim: true },
    introduction: { type: String, trim: true },
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

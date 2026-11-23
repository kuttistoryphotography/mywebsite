
import mongoose, { Document, Model, Schema } from "mongoose";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export type FinalPackageStatus =
  | "draft"
  | "published"
  | "confirmed"
  | "revoked";

export type FinalPackageSource = "template" | "manual";

export type FinalPackageAddonStatus =
  | "included"
  | "selected"
  | "optional";

export interface IFinalPackageAddon {
  addonId?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  status: FinalPackageAddonStatus;
}

export interface IFinalPackageService {
  name: string;
  description?: string;
  quantity: number;
}

export interface IFinalPackageDeliverable {
  name: string;
  description?: string;
  quantity: number;
}

export interface IFinalPackageGallery {
  title: string;
  imageUrl: string;
  category?: string;
  caption?: string;
}

export interface IFinalPackage extends Document {
  packageNumber: string;
  publicToken: string;
  linkRevoked: boolean;

  client: {
    name: string;
    partnerName?: string;
    phone: string;
    email?: string;
  };

  eventDetails: {
    eventType: string;
    eventDate?: Date;
    venue?: string;
    location?: string;
  };

  packageDetails: {
    sourceType: FinalPackageSource;
    templateId?: mongoose.Types.ObjectId;
    packageName: string;
    description?: string;
    services: IFinalPackageService[];
    deliverables: IFinalPackageDeliverable[];
  };

  addons: IFinalPackageAddon[];

  gallery: IFinalPackageGallery[];

  pricing: {
    basePrice: number;
    addonsTotal: number;
    discount: number;
    gstPercentage: number;
    gstAmount: number;
    finalAmount: number;
  };

  paymentTerms: {
    label: string;
    percentage?: number;
    amount?: number;
    dueDate?: Date;
  }[];

  termsAndConditions: string[];

  sectionsOrder: string[];

  introduction?: string;
  closingMessage?: string;

  status: FinalPackageStatus;

  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------------
// MONGOOSE SCHEMA
// --------------------------------------------------

const FinalPackageSchema = new Schema<IFinalPackage>(
  {
    packageNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    publicToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    linkRevoked: {
      type: Boolean,
      default: false,
    },

    client: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      partnerName: {
        type: String,
        trim: true,
        default: "",
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
    },

    eventDetails: {
      eventType: {
        type: String,
        default: "Wedding",
        trim: true,
      },
      eventDate: Date,
      venue: {
        type: String,
        trim: true,
        default: "",
      },
      location: {
        type: String,
        trim: true,
        default: "",
      },
    },

    packageDetails: {
      sourceType: {
        type: String,
        enum: ["template", "manual"],
        required: true,
        default: "manual",
      },
      templateId: {
        type: Schema.Types.ObjectId,
        ref: "FinalPackageTemplate",
      },
      packageName: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        default: "",
      },
      services: [
        {
          name: { type: String, required: true, trim: true },
          description: { type: String, default: "" },
          quantity: { type: Number, min: 0, default: 1 },
        },
      ],
      deliverables: [
        {
          name: { type: String, required: true, trim: true },
          description: { type: String, default: "" },
          quantity: { type: Number, min: 0, default: 1 },
        },
      ],
    },

    addons: [
      {
        addonId: { type: String, default: "" },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        price: { type: Number, min: 0, required: true },
        quantity: { type: Number, min: 0, default: 1 },
        status: {
          type: String,
          enum: ["included", "selected", "optional"],
          default: "optional",
        },
      },
    ],

    gallery: [
      {
        title: { type: String, default: "" },
        imageUrl: { type: String, required: true },
        category: { type: String, default: "" },
        caption: { type: String, default: "" },
      },
    ],

    pricing: {
      basePrice: { type: Number, min: 0, default: 0 },
      addonsTotal: { type: Number, min: 0, default: 0 },
      discount: { type: Number, min: 0, default: 0 },
      gstPercentage: { type: Number, min: 0, max: 100, default: 0 },
      gstAmount: { type: Number, min: 0, default: 0 },
      finalAmount: { type: Number, min: 0, default: 0 },
    },

    paymentTerms: [
      {
        label: { type: String, required: true, trim: true },
        percentage: { type: Number, min: 0, max: 100 },
        amount: { type: Number, min: 0 },
        dueDate: Date,
      },
    ],

    termsAndConditions: {
      type: [String],
      default: [],
    },

    sectionsOrder: {
      type: [String],
      default: [
        "introduction",
        "client",
        "event",
        "package",
        "services",
        "deliverables",
        "gallery",
        "addons",
        "pricing",
        "payment",
        "terms",
        "closing",
      ],
    },

    introduction: {
      type: String,
      default: "",
    },

    closingMessage: {
      type: String,
      default: "Thank you for choosing KuttiStory Photography.",
    },

    status: {
      type: String,
      enum: ["draft", "published", "confirmed", "revoked"],
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

// --------------------------------------------------
// INDEXES
// --------------------------------------------------

FinalPackageSchema.index({ status: 1, createdAt: -1 });
FinalPackageSchema.index({ "client.name": 1 });

// --------------------------------------------------
// MODEL EXPORT
// --------------------------------------------------

const FinalPackage: Model<IFinalPackage> =
  mongoose.models.FinalPackage ||
  mongoose.model<IFinalPackage>(
    "FinalPackage",
    FinalPackageSchema
  );

export default FinalPackage;

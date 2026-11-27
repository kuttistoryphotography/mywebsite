
import mongoose, { Document, Model, Schema } from "mongoose";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export type PackageCategory =
  | "basic"
  | "standard"
  | "premium"
  | "vip";

export type PackageEventType = "wedding" | "engagement";

export interface ITemplateService {
  name: string;
  description?: string;
  quantity: number;
}

export interface ITemplateDeliverable {
  name: string;
  description?: string;
  quantity: number;
}

export interface IFinalPackageTemplate extends Document {
  templateCode: string;
  eventType: PackageEventType;
  packageName: string;
  category: PackageCategory;
  description: string;
  basePrice: number;

  services: ITemplateService[];
  deliverables: ITemplateDeliverable[];

  isActive: boolean;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}



// --------------------------------------------------
// SCHEMA
// --------------------------------------------------

const FinalPackageTemplateSchema =
  new Schema<IFinalPackageTemplate>(
    {
      templateCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
      },

      packageName: {
        type: String,
        required: true,
        trim: true,
      },

      category: {
        type: String,
        enum: ["basic", "standard", "premium", "vip"],
        required: true,
      },

      eventType: {
        type: String,
        enum: ["wedding", "engagement"],
        default: "wedding",
        required: true,
        lowercase: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },

      services: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          description: {
            type: String,
            default: "",
          },
          quantity: {
            type: Number,
            min: 0,
            default: 1,
          },
        },
      ],

      deliverables: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          description: {
            type: String,
            default: "",
          },
          quantity: {
            type: Number,
            min: 0,
            default: 1,
          },
        },
      ],

      isActive: {
        type: Boolean,
        default: true,
      },

      sortOrder: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

// --------------------------------------------------
// INDEXES
// --------------------------------------------------

FinalPackageTemplateSchema.index({
  category: 1,
  sortOrder: 1,
});

FinalPackageTemplateSchema.index({
  isActive: 1,
});

// --------------------------------------------------
// MODEL EXPORT
// --------------------------------------------------

const FinalPackageTemplate: Model<IFinalPackageTemplate> =
  mongoose.models.FinalPackageTemplate ||
  mongoose.model<IFinalPackageTemplate>(
    "FinalPackageTemplate",
    FinalPackageTemplateSchema
  );

export default FinalPackageTemplate;

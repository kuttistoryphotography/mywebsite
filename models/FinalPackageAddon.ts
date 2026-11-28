
import mongoose, { Schema, Model } from "mongoose";

export interface IFinalPackageAddon {
  eventType: "shared" | "reception";
  addonCode: string;
  name: string;
  description?: string;
  category: string;
  defaultPrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const FinalPackageAddonSchema = new Schema<IFinalPackageAddon>(
    {
      eventType: {
        type: String,
        enum: ["shared", "reception"],
        default: "shared",
      },

      addonCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "Other",
      trim: true,
    },

    defaultPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

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

FinalPackageAddonSchema.index({ isActive: 1, sortOrder: 1 });

const FinalPackageAddon: Model<IFinalPackageAddon> =
  mongoose.models.FinalPackageAddon ||
  mongoose.model<IFinalPackageAddon>(
    "FinalPackageAddon",
    FinalPackageAddonSchema
  );

export default FinalPackageAddon;

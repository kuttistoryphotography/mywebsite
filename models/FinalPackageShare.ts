
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFinalPackageShare extends Document {
  tokenHash: string;
  status: "active" | "revoked";
  expiresAt?: Date | null;
  createdBy: string;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FinalPackageShareSchema = new Schema<IFinalPackageShare>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const FinalPackageShare: Model<IFinalPackageShare> =
  mongoose.models.FinalPackageShare ||
  mongoose.model<IFinalPackageShare>(
    "FinalPackageShare",
    FinalPackageShareSchema
  );

export default FinalPackageShare;

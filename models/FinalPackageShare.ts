
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFinalPackageShare extends Document {
  tokenHash: string;
  tokenEncrypted?: string | null;
  status: "active" | "revoked";
  expiresAt?: Date | null;
  createdBy: string;
  eventType?: "wedding" | "engagement";
  layout?: Record<string, unknown> | null;
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
    tokenEncrypted: {
      type: String,
      default: null,
      select: false,
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
    eventType: {
      type: String,
      enum: ["wedding", "engagement"],
      default: "wedding",
    },
    layout: {
      type: Schema.Types.Mixed,
      default: null,
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

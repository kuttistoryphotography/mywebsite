
import mongoose, { Schema, Model, Types } from "mongoose";

export type FinalPackageEventAction =
  | "created"
  | "updated"
  | "published"
  | "shared"
  | "confirmed"
  | "revoked"
  | "restored";

export interface IFinalPackageEventLog {
  packageId: Types.ObjectId;
  action: FinalPackageEventAction;
  description: string;
  performedBy?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

const FinalPackageEventLogSchema =
  new Schema<IFinalPackageEventLog>(
    {
      packageId: {
        type: Schema.Types.ObjectId,
        ref: "FinalPackage",
        required: true,
        index: true,
      },

      action: {
        type: String,
        enum: [
          "created",
          "updated",
          "published",
          "shared",
          "confirmed",
          "revoked",
          "restored",
        ],
        required: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      performedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: {
        createdAt: true,
        updatedAt: false,
      },
    }
  );

FinalPackageEventLogSchema.index({
  packageId: 1,
  createdAt: -1,
});

const FinalPackageEventLog: Model<IFinalPackageEventLog> =
  mongoose.models.FinalPackageEventLog ||
  mongoose.model<IFinalPackageEventLog>(
    "FinalPackageEventLog",
    FinalPackageEventLogSchema
  );

export default FinalPackageEventLog;

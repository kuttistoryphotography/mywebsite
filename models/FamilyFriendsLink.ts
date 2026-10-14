
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IFamilyFriendsLink extends Document {
  clientId: Types.ObjectId;
  recipientName: string;
  driveUrl: string;
  token: string;
  status: "active" | "revoked";
  createdAt: Date;
  revokedAt?: Date;
}

const FamilyFriendsLinkSchema = new Schema<IFamilyFriendsLink>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientName: { type: String, required: true, trim: true },
    driveUrl: { type: String, required: true, trim: true },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
  },
  { timestamps: false }
);

FamilyFriendsLinkSchema.index({ clientId: 1, createdAt: -1 });

const FamilyFriendsLink: Model<IFamilyFriendsLink> =
  mongoose.models.FamilyFriendsLink ||
  mongoose.model<IFamilyFriendsLink>(
    "FamilyFriendsLink",
    FamilyFriendsLinkSchema
  );

export default FamilyFriendsLink;

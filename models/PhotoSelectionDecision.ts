import mongoose, { Document, Model, Schema } from "mongoose";

export type PhotoSelectionDecisionType =
  | "selected"
  | "rejected";

export interface IPhotoSelectionDecision extends Document {
  eventId: mongoose.Types.ObjectId;
  photoId: mongoose.Types.ObjectId;

  originalFilename: string;

  decision: PhotoSelectionDecisionType;

  clientId?: mongoose.Types.ObjectId;

  decidedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PhotoSelectionDecisionSchema =
  new Schema<IPhotoSelectionDecision>(
    {
      eventId: {
        type: Schema.Types.ObjectId,
        ref: "PhotoSelectionEvent",
        required: true,
        index: true,
      },

      photoId: {
        type: Schema.Types.ObjectId,
        ref: "PhotoSelectionPhoto",
        required: true,
        index: true,
      },

      originalFilename: {
        type: String,
        required: true,
        trim: true,
      },

      decision: {
        type: String,
        enum: ["selected", "rejected"],
        required: true,
      },

      clientId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },

      decidedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

PhotoSelectionDecisionSchema.index(
  {
    eventId: 1,
    photoId: 1,
  },
  {
    unique: true,
  }
);

const PhotoSelectionDecision: Model<IPhotoSelectionDecision> =
  mongoose.models.PhotoSelectionDecision ||
  mongoose.model<IPhotoSelectionDecision>(
    "PhotoSelectionDecision",
    PhotoSelectionDecisionSchema
  );

export default PhotoSelectionDecision;
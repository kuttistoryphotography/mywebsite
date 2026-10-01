import mongoose, { Document, Model, Schema } from "mongoose";

export type PhotoSelectionSubmissionStatus =
  | "submitted"
  | "reviewed"
  | "completed";

export interface IPhotoSelectionSubmission extends Document {
  eventId: mongoose.Types.ObjectId;

  selectedCount: number;
  rejectedCount: number;

  status: PhotoSelectionSubmissionStatus;

  submittedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PhotoSelectionSubmissionSchema =
  new Schema<IPhotoSelectionSubmission>(
    {
      eventId: {
        type: Schema.Types.ObjectId,
        ref: "PhotoSelectionEvent",
        required: true,
        unique: true,
        index: true,
      },

      selectedCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      rejectedCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      status: {
        type: String,
        enum: ["submitted", "reviewed", "completed"],
        default: "submitted",
      },

      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

const PhotoSelectionSubmission: Model<IPhotoSelectionSubmission> =
  mongoose.models.PhotoSelectionSubmission ||
  mongoose.model<IPhotoSelectionSubmission>(
    "PhotoSelectionSubmission",
    PhotoSelectionSubmissionSchema
  );

export default PhotoSelectionSubmission;
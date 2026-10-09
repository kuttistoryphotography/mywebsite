
import mongoose, { Schema, Model } from "mongoose";

export interface IPhotoSelectionActivity {
  eventId: mongoose.Types.ObjectId;
  eventCode: string;
  eventName: string;
  clientName: string;
  activityType:
    | "event_created"
    | "event_deleted"
    | "photos_uploaded"
    | "photo_deleted"
    | "selection_submitted"
    | "selection_updated";
  description: string;
  selectedCount?: number;
  rejectedCount?: number;
  photoCount?: number;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PhotoSelectionActivitySchema =
  new Schema<IPhotoSelectionActivity>(
    {
      eventId: {
        type: Schema.Types.ObjectId,
        ref: "PhotoSelectionEvent",
        required: true,
        index: true,
      },
      eventCode: {
        type: String,
        required: true,
      },
      eventName: {
        type: String,
        required: true,
      },
      clientName: {
        type: String,
        required: true,
      },
      activityType: {
        type: String,
        enum: [
          "event_created",
          "event_deleted",
          "photos_uploaded",
          "photo_deleted",
          "selection_submitted",
          "selection_updated",
        ],
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      selectedCount: Number,
      rejectedCount: Number,
      photoCount: Number,
      createdBy: String,
    },
    {
      timestamps: true,
    }
  );

const PhotoSelectionActivity: Model<IPhotoSelectionActivity> =
  mongoose.models.PhotoSelectionActivity ||
  mongoose.model<IPhotoSelectionActivity>(
    "PhotoSelectionActivity",
    PhotoSelectionActivitySchema
  );

export default PhotoSelectionActivity;

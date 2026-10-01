import mongoose, { Document, Model, Schema } from "mongoose";

export type PhotoSelectionEventStatus =
  | "active"
  | "submitted"
  | "closed";

export interface IPhotoSelectionEvent extends Document {
  eventCode: string;
  eventName: string;
  clientName: string;

  // Optional links to your existing system
  clientId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId;

  totalPhotos: number;
  selectionLimit: number;

  status: PhotoSelectionEventStatus;

  createdBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const PhotoSelectionEventSchema =
  new Schema<IPhotoSelectionEvent>(
    {
      eventCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        uppercase: true,
      },

      eventName: {
        type: String,
        required: true,
        trim: true,
      },

      clientName: {
        type: String,
        required: true,
        trim: true,
      },

      clientId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      bookingId: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
      },

      folderId: {
        type: Schema.Types.ObjectId,
        ref: "Folder",
      },

      totalPhotos: {
        type: Number,
        default: 0,
        min: 0,
      },

      selectionLimit: {
        type: Number,
        default: 250,
        min: 1,
      },

      status: {
        type: String,
        enum: ["active", "submitted", "closed"],
        default: "active",
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
    }
  );

const PhotoSelectionEvent: Model<IPhotoSelectionEvent> =
  mongoose.models.PhotoSelectionEvent ||
  mongoose.model<IPhotoSelectionEvent>(
    "PhotoSelectionEvent",
    PhotoSelectionEventSchema
  );

export default PhotoSelectionEvent;
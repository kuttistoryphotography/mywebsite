import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPhotoSelectionPhoto extends Document {
  photoId: string;
  eventId: mongoose.Types.ObjectId;
  fileId: mongoose.Types.ObjectId;

  originalFilename: string;

  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;

  thumbnailUrl?: string;
  previewUrl?: string;

  sequence: number;

  createdAt: Date;
  updatedAt: Date;
}

const PhotoSelectionPhotoSchema =
  new Schema<IPhotoSelectionPhoto>(
    {
      photoId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
      },

      eventId: {
        type: Schema.Types.ObjectId,
        ref: "PhotoSelectionEvent",
        required: true,
        index: true,
      },

      fileId: {
        type: Schema.Types.ObjectId,
        ref: "FileDoc",
        required: true,
        index: true,
     },

      originalFilename: {
        type: String,
        required: true,
        trim: true,
      },

      cloudinaryPublicId: {
        type: String,
        trim: true,
      },

      cloudinaryUrl: {
        type: String,
        trim: true,
      },

      thumbnailUrl: {
        type: String,
        trim: true,
      },

      previewUrl: {
        type: String,
        trim: true,
      },

      sequence: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      timestamps: true,
    }
  );

PhotoSelectionPhotoSchema.index({
  eventId: 1,
  sequence: 1,
});

const PhotoSelectionPhoto: Model<IPhotoSelectionPhoto> =
  mongoose.models.PhotoSelectionPhoto ||
  mongoose.model<IPhotoSelectionPhoto>(
    "PhotoSelectionPhoto",
    PhotoSelectionPhotoSchema
  );

export default PhotoSelectionPhoto;
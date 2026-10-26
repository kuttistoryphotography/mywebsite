
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPhotoSelectionProgress extends Document {
  eventId: mongoose.Types.ObjectId;
  selectedPhotoIds: mongoose.Types.ObjectId[];
  rejectedPhotoIds: mongoose.Types.ObjectId[];
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSelectionProgressSchema =
  new Schema<IPhotoSelectionProgress>(
    {
      eventId: {
        type: Schema.Types.ObjectId,
        ref: "PhotoSelectionEvent",
        required: true,
        unique: true,
        index: true,
      },

      selectedPhotoIds: {
        type: [Schema.Types.ObjectId],
        default: [],
      },

      rejectedPhotoIds: {
        type: [Schema.Types.ObjectId],
        default: [],
      },

      savedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

const PhotoSelectionProgress: Model<IPhotoSelectionProgress> =
  mongoose.models.PhotoSelectionProgress ||
  mongoose.model<IPhotoSelectionProgress>(
    "PhotoSelectionProgress",
    PhotoSelectionProgressSchema
  );

export default PhotoSelectionProgress;

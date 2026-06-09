/**
 * models/DriveFile.ts
 *
 * @deprecated All new uploads use CloudinaryFile.
 * This model is kept so legacy documents in MongoDB continue to deserialise.
 * No new records should be created here.
 *
 * Re-exports CloudinaryFile for any code that still imports DriveFile.
 */

export {
  CloudinaryFile as DriveFile,
  type ICloudinaryFile as IDriveFile,
  type CloudinaryContext as DriveContext,
  cloudinaryPreviewUrl as drivePreviewUrl,
  cloudinaryDownloadUrl as driveDownloadUrl,
} from './CloudinaryFile';

import mongoose, { Document, Model, Schema } from 'mongoose';

// Keep the old schema in DB so legacy documents are still readable
const DriveFileSchema = new Schema(
  {
    originalName:     String,
    driveFileId:      String,
    driveUrl:         String,
    driveWebViewLink: String,
    driveFolderName:  String,
    mimeType:         String,
    fileSizeBytes:    { type: Number, default: 0 },
    context:          String,
    label:            String,
    refModel:         String,
    refId:            Schema.Types.ObjectId,
    uploadedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Only register if not already registered (avoids model overwrite errors)
export const DriveFileLegacy: Model<any> =
  mongoose.models.DriveFile ||
  mongoose.model('DriveFile', DriveFileSchema);

import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  whatsappNumber?: string;
  role: 'client' | 'admin';
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  city: string;
  state: string;
  address: string;
  pincode: string;

  profileCompleted: boolean;

  // Client Memories
  memoriesDriveUrl?: string;

  // Family & Friends Memories Link
  googleReviewUrl?: string;
  memoriesShareToken?: string;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      default: '',
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
    },

    whatsappNumber: {
      type: String,
    },

    role: {
      type: String,
      enum: ['client', 'admin'],
      default: 'client',
    },

    avatarUrl: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    googleId: {
      type: String,
    },

    address: {
      type: String,
      default: '',
    },

    city: {
      type: String,
      default: '',
    },

    state: {
      type: String,
      default: '',
    },

    pincode: {
      type: String,
      default: '',
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // Client's Google Drive Memories Folder
    memoriesDriveUrl: {
      type: String,
      default: '',
    },

    // Google Business Profile Review Link
    googleReviewUrl: {
      type: String,
      default: '',
    },

    // Private/random token for Family & Friends sharing
    memoriesShareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
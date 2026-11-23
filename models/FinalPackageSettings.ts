
import mongoose, { Schema, Model } from "mongoose";

export interface IFinalPackageSettings {
  businessName: string;
  tagline: string;
  logo: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;

  gstPercentage: number;
  advancePercentage: number;
  balancePaymentText: string;

  defaultTermsAndConditions: string[];

  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };

  updatedAt?: Date;
  createdAt?: Date;
}

const FinalPackageSettingsSchema =
  new Schema<IFinalPackageSettings>(
    {
      businessName: {
        type: String,
        default: "KuttiStory Photography",
        trim: true,
      },

      tagline: {
        type: String,
        default: "Capturing Life, One Story at a Time",
        trim: true,
      },

      logo: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },

      whatsappNumber: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      gstPercentage: {
        type: Number,
        default: 0,
        min: 0,
      },

      advancePercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },

      balancePaymentText: {
        type: String,
        default: "Remaining balance payable on or before the event day.",
      },

      defaultTermsAndConditions: {
        type: [String],
        default: [],
      },

      theme: {
        primaryColor: {
          type: String,
          default: "#14233B",
        },

        secondaryColor: {
          type: String,
          default: "#C6A15B",
        },

        backgroundColor: {
          type: String,
          default: "#F8F5EF",
        },

        textColor: {
          type: String,
          default: "#252525",
        },
      },
    },
    {
      timestamps: true,
    }
  );

const FinalPackageSettings: Model<IFinalPackageSettings> =
  mongoose.models.FinalPackageSettings ||
  mongoose.model<IFinalPackageSettings>(
    "FinalPackageSettings",
    FinalPackageSettingsSchema
  );

export default FinalPackageSettings;

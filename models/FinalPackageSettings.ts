
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

  layout: {
    heroBackgroundImage: string;
    heroLogo: string;
    coupleImage: string;
    ribbonImage: string;
    flowerImage: string;
    addonsImage: string;
    paymentImage: string;
    termsImage: string;
    contactImage: string;

    showHero: boolean;
    showIntroduction: boolean;
    showPackages: boolean;
    showAddons: boolean;
    showPaymentTerms: boolean;
    showContact: boolean;
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
      logo: { type: String, default: "" },
      phone: { type: String, default: "" },
      whatsappNumber: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },

      gstPercentage: { type: Number, default: 0, min: 0 },
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

      layout: {
        heroBackgroundImage: {
          type: String,
          default: "/images/wedding-hero-decoration.png",
        },
        heroLogo: {
          type: String,
          default: "/images/kutti-story-logo-white.png",
        },
        coupleImage: {
          type: String,
          default: "/images/wedding-catalogue-couple.png",
        },
        ribbonImage: {
          type: String,
          default: "/images/wedding-blue-ribbon.png",
        },
        flowerImage: {
          type: String,
          default: "/images/wedding-flower.png",
        },
        addonsImage: {
          type: String,
          default: "/images/additional-services-bride.png",
        },
        paymentImage: {
          type: String,
          default: "/images/payment-terms-couple.png",
        },
        termsImage: {
          type: String,
          default: "/images/terms-elephant-frame.png",
        },
        contactImage: {
          type: String,
          default: "/images/contact-paper-foliage.png",
        },

        showHero: { type: Boolean, default: true },
        showIntroduction: { type: Boolean, default: true },
        showPackages: { type: Boolean, default: true },
        showAddons: { type: Boolean, default: true },
        showPaymentTerms: { type: Boolean, default: true },
        showContact: { type: Boolean, default: true },
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

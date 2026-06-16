import mongoose, { Schema, Model } from "mongoose";

export interface IPaymentSettings {
  upiId: string;
  accountName: string;
}

const PaymentSettingsSchema = new Schema(
  {
    upiId: {
      type: String,
      default: "rajaxismdu@axl",
    },

    accountName: {
      type: String,
      default: "Kutti Story Photography",
    },
  },
  {
    timestamps: true,
  }
);

const PaymentSettings: Model<IPaymentSettings> =
  mongoose.models.PaymentSettings ||
  mongoose.model<IPaymentSettings>(
    "PaymentSettings",
    PaymentSettingsSchema
  );

export default PaymentSettings;

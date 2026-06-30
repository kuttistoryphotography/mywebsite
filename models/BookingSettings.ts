import mongoose, { Schema, models, model } from "mongoose";

const BookingSettingsSchema = new Schema(
  {
    bookingImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default models.BookingSettings ||
  model("BookingSettings", BookingSettingsSchema);
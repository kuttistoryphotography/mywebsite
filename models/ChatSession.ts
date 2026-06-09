// models/ChatSession.ts

import mongoose from "mongoose";

const ChatSessionSchema = new mongoose.Schema({
  messages: Array,
});

export default mongoose.models.ChatSession ||
  mongoose.model("ChatSession", ChatSessionSchema);
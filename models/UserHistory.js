import mongoose from "mongoose";

const HistoryItemSchema = new mongoose.Schema(
  {
    userPrompt: {
      type: String,
      required: true,
    },
    ai_response: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const UserHistorySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    history: [HistoryItemSchema],
  },
  { timestamps: true }
);

if (mongoose.models.UserHistory) {
  delete mongoose.models.UserHistory;
}

export default mongoose.model("UserHistory", UserHistorySchema);


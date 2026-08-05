import mongoose from "mongoose";

const ChosenPathStepSchema = new mongoose.Schema(
  {
    pathId: {
      type: String,
      required: true,
    },
    pathName: {
      type: String,
      required: true,
    },
    story: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "mindset",
    },
    probability: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const DecisionItemSchema = new mongoose.Schema(
  {
    obj_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "UserHistory",
    },
    userPrompt: {
      type: String,
      required: true,
    },
    chosenPath: [ChosenPathStepSchema],
    acceptedAiRecommendation: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const SavedDecisionSchema = new mongoose.Schema(
  {
    userHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserHistory",
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    savedDecisions: [DecisionItemSchema],
  },
  { timestamps: true }
);

if (mongoose.models.SavedDecision) {
  delete mongoose.models.SavedDecision;
}

export default mongoose.model("SavedDecision", SavedDecisionSchema);

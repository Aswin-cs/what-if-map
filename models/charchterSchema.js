import mongoose from "mongoose";

const characterProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserHistory'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  // Tracks the SavedDecision subdocument _ids used for the last AI analysis.
  // If current savedDecisions._id set differs from this, re-analysis is needed.
  analyzedDecisionIds: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
  riskTolerance: {
    type: String,
    enum: ["Risk-Averse", "Balanced", "High-Risk"]
  },
  decisionStyle: { 
    type: String, 
    description: "Short, crisp decision style (e.g., 'Calculated Risk-Taker', 'Validation Seeker', 'Cautious Planner')" 
  },
  traitsSummary: { 
    type: String, 
    description: "2-3 sentences summarizing behavioral patterns across past decisions, noting changes in risk tolerance." 
  }
}, { timestamps: true });

if (mongoose.models.CharacterProfile) {
  delete mongoose.models.CharacterProfile;
}

export default mongoose.model('CharacterProfile', characterProfileSchema);

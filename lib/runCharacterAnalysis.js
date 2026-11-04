import connectDb from "@/lib/connectDb";
import CharacterProfile from "@/models/charchterSchema";
import SavedDecision from "@/models/SavedDecision";
import { callGeminiWithFallback } from "@/lib/aiService";

const characterProfileResponseSchema = {
  type: "object",
  properties: {
    riskTolerance: {
      type: "string",
      enum: ["Risk-Averse", "Balanced", "High-Risk"],
    },
    decisionStyle: {
      type: "string",
      description: "Short, crisp decision style (e.g. 'Calculated Risk-Taker', 'Validation Seeker', 'Cautious Planner')",
    },
    traitsSummary: {
      type: "string",
      description: "2-3 sentences summarizing behavioral patterns across past decisions.",
    },
  },
  required: ["riskTolerance", "decisionStyle", "traitsSummary"],
};

/**
 * Runs AI character profile analysis for a user ONLY if their
 * savedDecision subdocument _ids have changed since the last analysis.
 *
 * @param {string} email - The user's email (lowercase).
 * @returns {Promise<{ skipped: boolean, profile?: object, updatedProfile?: object, reason?: string }>}
 */
export async function runCharacterAnalysis(email) {
  const userEmail = email.toLowerCase();
  await connectDb();

  // 1. Fetch saved decisions with projection (only needed fields)
  const savedDoc = await SavedDecision.findOne(
    { email: userEmail },
    { savedDecisions: 1 }
  ).lean();

  const savedDecisions = savedDoc?.savedDecisions || [];
  if (savedDecisions.length === 0) {
    return { skipped: true, reason: "No saved decisions to analyze." };
  }

  // 2. Collect current subdocument _ids (sorted for stable comparison)
  const currentDecisionIds = savedDecisions
    .map((d) => d._id?.toString())
    .filter(Boolean)
    .sort();

  // 3. Check existing CharacterProfile for previously analyzed IDs
  const existingProfile = await CharacterProfile.findOne(
    { email: userEmail },
    { analyzedDecisionIds: 1, riskTolerance: 1, decisionStyle: 1, traitsSummary: 1 }
  ).lean();

  const previousIds = (existingProfile?.analyzedDecisionIds || [])
    .map((id) => id.toString())
    .sort();

  // 4. Compare — skip analysis if IDs are identical (no changes)
  const idsMatch =
    currentDecisionIds.length === previousIds.length &&
    currentDecisionIds.every((id, i) => id === previousIds[i]);

  if (idsMatch) {
    return {
      skipped: true,
      reason: "Decision IDs unchanged since last analysis.",
      profile: existingProfile
        ? {
            riskTolerance: existingProfile.riskTolerance,
            decisionStyle: existingProfile.decisionStyle,
            traitsSummary: existingProfile.traitsSummary,
          }
        : null,
    };
  }

  // 5. Build minimal context for AI
  const cleanedDecisions = savedDecisions.map(({ _id, ...rest }) => rest);
  const prompt = `You are a psychological decision-analyst AI for the "What-If" Map platform.
Analyze the user's historical decision choices across scenarios to construct an updated behavioral profile.

[HISTORICAL EXECUTED MAPS & SAVED DECISIONS]:
${JSON.stringify({ savedDecisions: cleanedDecisions }, null, 2)}

[TASK]:
Evaluate whether the user trends towards high-risk, balanced, or risk-averse paths.
Observe whether they prefer immediate action, cautious testing, or status quo options.
Generate a refined character profile reflecting their current decision-making mindset.`;

  // 6. Use unified Gemini fallback
  const aiData = await callGeminiWithFallback({
    prompt,
    schema: characterProfileResponseSchema,
    temperature: 0.4,
  });

  const updatedProfile = await CharacterProfile.findOneAndUpdate(
    { email: userEmail },
    {
      $set: {
        riskTolerance: aiData.riskTolerance,
        decisionStyle: aiData.decisionStyle,
        traitsSummary: aiData.traitsSummary,
        analyzedDecisionIds: currentDecisionIds,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return {
    skipped: false,
    updatedProfile: {
      riskTolerance: updatedProfile.riskTolerance,
      decisionStyle: updatedProfile.decisionStyle,
      traitsSummary: updatedProfile.traitsSummary,
      updatedAt: updatedProfile.updatedAt,
    },
  };
}

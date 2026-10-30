import { GoogleGenAI } from "@google/genai";
import connectDb from "@/lib/connectDb";
import CharacterProfile from "@/models/charchterSchema";
import UserHistory from "@/models/UserHistory";
import SavedDecision from "@/models/SavedDecision";

const characterProfileResponseSchema = {
  type: "object",
  properties: {
    riskTolerance: {
      type: "string",
      enum: ["Risk-Averse", "Balanced", "High-Risk"],
    },
    decisionStyle: {
      type: "string",
      description:
        "Short, crisp decision style (e.g., 'Calculated Risk-Taker', 'Validation Seeker', 'Cautious Planner')",
    },
    traitsSummary: {
      type: "string",
      description:
        "2-3 sentences summarizing behavioral patterns across past decisions, noting changes in risk tolerance.",
    },
  },
  required: ["riskTolerance", "decisionStyle", "traitsSummary"],
};

/**
 * Runs AI character profile analysis for a user, but ONLY if their
 * savedDecision subdocument _ids have changed since the last analysis.
 *
 * @param {string} email - The user's email (lowercase).
 * @returns {{ skipped: boolean, profile?: object, updatedProfile?: object }}
 */
export async function runCharacterAnalysis(email) {
  const userEmail = email.toLowerCase();

  await connectDb();

  // 1. Fetch current saved decisions
  const savedDecisionDoc = await SavedDecision.findOne({ email: userEmail }).lean();
  const savedDecisions = savedDecisionDoc?.savedDecisions || [];

  if (savedDecisions.length === 0) {
    return { skipped: true, reason: "No saved decisions to analyze." };
  }

  // 2. Collect current subdocument _ids (sorted for stable comparison)
  const currentDecisionIds = savedDecisions
    .map((d) => d._id?.toString())
    .filter(Boolean)
    .sort();

  // 3. Check existing CharacterProfile for previously analyzed IDs
  const existingProfile = await CharacterProfile.findOne({ email: userEmail }).lean();
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

  // 5. IDs changed — run AI analysis
  const userHistory = await UserHistory.findOne({ email: userEmail });

  const cleanedDecisions = savedDecisions.map(({ _id, ...rest }) => rest);
  const historyContext = JSON.stringify(
    { savedDecisions: cleanedDecisions },
    null,
    2
  );

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
    You are a psychological decision-analyst AI for the "What-If" Map platform.
    Analyze the user's historical decision choices across scenarios to construct an updated behavioral profile.

    [HISTORICAL EXECUTED MAPS & SAVED DECISIONS]:
    ${historyContext}

    [TASK]:
    Evaluate whether the user trends towards high-risk, balanced, or risk-averse paths. 
    Observe whether they prefer immediate action, cautious testing, or status quo options.
    Generate a refined character profile reflecting their current decision-making mindset.
  `;

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let response = null;
  let lastError = null;

  for (const modelName of models) {
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: characterProfileResponseSchema,
          temperature: 0.4,
        },
      });
      if (response) break;
    } catch (err) {
      console.warn(
        `[runCharacterAnalysis] Model '${modelName}' failed:`,
        err.message || err
      );
      lastError = err;
    }
  }

  if (!response) {
    throw new Error(
      `AI model analysis failed: ${lastError?.message || lastError}`
    );
  }

  const profileData = JSON.parse(response.text);
  const userObjId = userHistory ? userHistory._id : null;

  // 6. Save profile + snapshot of analyzed decision IDs
  let updatedProfile = await CharacterProfile.findOneAndUpdate(
    { email: userEmail },
    {
      $set: {
        email: userEmail,
        userId: userObjId,
        analyzedDecisionIds: currentDecisionIds,
        ...profileData,
      },
    },
    { upsert: true, returnDocument: "after", new: true }
  );

  // Fallback create
  if (!updatedProfile || !updatedProfile.email) {
    updatedProfile = await CharacterProfile.create({
      email: userEmail,
      userId: userObjId,
      analyzedDecisionIds: currentDecisionIds,
      ...profileData,
    });
  }

  return { skipped: false, profile: profileData, updatedProfile };
}

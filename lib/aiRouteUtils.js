import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getRateLimitKey, buildRateLimitBody } from "@/lib/rateLimit";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";
import mongoose from "mongoose";

/**
 * Authenticates Next.js request session and checks rate limiter if provided.
 * @param {Request} req - The incoming Next.js request
 * @param {object|null} limiter - Optional rate limiter instance
 * @returns {Promise<{ userEmail?: string, session?: object, errorResponse?: NextResponse }>}
 */
export async function authenticateAndRateLimit(req, limiter = null) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      ),
    };
  }

  if (limiter) {
    const rateLimitKey = getRateLimitKey(req, session);
    const { allowed, retryAfterMs } = limiter.check(rateLimitKey);
    if (!allowed) {
      const { body, options } = buildRateLimitBody(retryAfterMs);
      return {
        errorResponse: NextResponse.json(body, options),
      };
    }
  }

  const userEmail = session.user.email.toLowerCase();
  return { userEmail, session };
}

/**
 * Saves or updates an AI scenario response in MongoDB UserHistory.
 * @param {object} params
 * @param {string} params.userEmail - Lowercased user email
 * @param {string|null} [params.historyId] - Optional history ObjectId string
 * @param {string|null} [params.userPrompt] - Optional user prompt string
 * @param {object} params.aiResponse - AI scenario map payload
 * @param {boolean} [params.createNew] - If true, pushes a new history entry. Default false (edit in place).
 * @returns {Promise<string|null>} history item ObjectId string or null
 */
export async function saveOrUpdateUserHistory({
  userEmail,
  historyId = null,
  userPrompt = null,
  aiResponse,
  createNew = false,
}) {
  try {
    await connectDb();

    // 1. If historyId is provided, update that specific history entry in place
    if (historyId && mongoose.Types.ObjectId.isValid(historyId)) {
      const targetObjectId = new mongoose.Types.ObjectId(historyId);
      const updateFields = {
        "history.$.ai_response": aiResponse,
      };
      if (userPrompt) {
        updateFields["history.$.userPrompt"] = userPrompt;
      }

      const res = await UserHistory.updateOne(
        { email: userEmail, "history._id": targetObjectId },
        { $set: updateFields }
      );

      if (res.matchedCount > 0) {
        return historyId;
      }
    }

    // 2. If createNew is true (e.g. POST /api/ai for initial generation), push a new history entry
    if (createNew) {
      const updatedDoc = await UserHistory.findOneAndUpdate(
        { email: userEmail },
        {
          $push: {
            history: {
              userPrompt,
              ai_response: aiResponse,
            },
          },
        },
        { upsert: true, returnDocument: "after" }
      );
      const lastItem = updatedDoc?.history?.[updatedDoc.history.length - 1];
      return lastItem ? lastItem._id.toString() : null;
    }

    // 3. Fallback for Edit / Continue: Update the latest existing history item for the user in place
    const userDoc = await UserHistory.findOne({ email: userEmail });
    if (userDoc?.history?.length > 0) {
      const lastIndex = userDoc.history.length - 1;
      const targetId = userDoc.history[lastIndex]._id.toString();
      if (userPrompt) {
        userDoc.history[lastIndex].userPrompt = userPrompt;
      }
      userDoc.history[lastIndex].ai_response = aiResponse;
      await userDoc.save();
      return targetId;
    }

    return null;
  } catch (dbError) {
    console.error("Error updating UserHistory in MongoDB:", dbError);
    return null;
  }
}

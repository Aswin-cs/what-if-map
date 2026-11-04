import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";
import SavedDecision from "@/models/SavedDecision";
import mongoose from "mongoose";
import { runCharacterAnalysis } from "@/lib/runCharacterAnalysis";
import { rateLimit } from "@/lib/rateLimit";
import { authenticateAndRateLimit } from "@/lib/aiRouteUtils";

const saveDecisionLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 15, name: "api-save-decision" });

export async function POST(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req, saveDecisionLimiter);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      obj_id,
      historyId,
      user_id,
      userPrompt,
      chosenPathNodes = [],
      acceptedAiRecommendation = false,
    } = body || {};

    if (!Array.isArray(chosenPathNodes) || chosenPathNodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Chosen path node details are required" },
        { status: 400 }
      );
    }

    await connectDb();

    // Fetch userHistory _id with lean projection (avoids pulling large history arrays)
    const userDoc = await UserHistory.findOne({ email: userEmail }, { _id: 1 }).lean();

    const formattedChosenPath = chosenPathNodes.map((n, idx) => ({
      pathId: String(n?.id || n?.pathId || `node_${idx}`),
      pathName: String(n?.data?.label || n?.label || n?.pathName || "Node Title"),
      story: String(n?.data?.msg || n?.data?.description || n?.msg || n?.story || ""),
      category: String(n?.data?.category || n?.category || "mindset"),
      probability: n?.data?.probability ?? n?.probability ?? null,
    }));

    const targetObjId = obj_id || historyId || user_id || null;
    const validObjId =
      targetObjId && mongoose.Types.ObjectId.isValid(targetObjId)
        ? new mongoose.Types.ObjectId(targetObjId)
        : null;

    const newDecisionData = {
      obj_id: validObjId,
      userPrompt: userPrompt || "Scenario Decision",
      chosenPath: formattedChosenPath,
      acceptedAiRecommendation: Boolean(acceptedAiRecommendation),
      createdAt: new Date(),
    };

    let updatedDoc = null;

    if (validObjId) {
      // Try updating existing decision in place
      updatedDoc = await SavedDecision.findOneAndUpdate(
        { email: userEmail, "savedDecisions.obj_id": validObjId },
        {
          $set: {
            userHistory: userDoc?._id || null,
            "savedDecisions.$": newDecisionData,
          },
        },
        { returnDocument: "after" }
      );
    }

    // Push new decision if not previously existing
    if (!updatedDoc) {
      updatedDoc = await SavedDecision.findOneAndUpdate(
        { email: userEmail },
        {
          $set: { userHistory: userDoc?._id || null },
          $push: { savedDecisions: newDecisionData },
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    // Trigger non-blocking character profile analysis
    let analysisResult = null;
    try {
      analysisResult = await runCharacterAnalysis(userEmail);
    } catch (err) {
      console.warn("[Save Decision] Non-blocking character analysis error:", err.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Decision path saved successfully!",
        savedDecision: updatedDoc,
        analysis: analysisResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving decision path:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const obj_id = searchParams.get("obj_id");

    await connectDb();

    const savedDoc = await SavedDecision.findOne({ email: userEmail }).lean();
    const savedDecisions = savedDoc?.savedDecisions || [];

    if (obj_id) {
      const match = savedDecisions.find(
        (item) => item.obj_id && item.obj_id.toString() === obj_id.toString()
      );
      return NextResponse.json(
        { success: true, savedDecision: match || null, savedDecisions },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, savedDecision: null, savedDecisions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/history/save-decision:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    let obj_id = searchParams.get("obj_id");

    if (!obj_id) {
      const body = await req.json().catch(() => ({}));
      obj_id = body?.obj_id || body?.historyId;
    }

    if (!obj_id || !mongoose.Types.ObjectId.isValid(obj_id)) {
      return NextResponse.json(
        { success: false, error: "Valid obj_id is required to undo decision save." },
        { status: 400 }
      );
    }

    await connectDb();

    const updatedDoc = await SavedDecision.findOneAndUpdate(
      { email: userEmail },
      { $pull: { savedDecisions: { obj_id: new mongoose.Types.ObjectId(obj_id) } } },
      { returnDocument: "after" }
    );

    let analysisResult = null;
    try {
      analysisResult = await runCharacterAnalysis(userEmail);
    } catch (err) {
      console.warn("[Save Decision] Non-blocking analysis update error:", err.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Saved decision removed successfully!",
        savedDecision: updatedDoc,
        analysis: analysisResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting saved decision path:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

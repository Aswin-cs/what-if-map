import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";
import SavedDecision from "@/models/SavedDecision";
import mongoose from "mongoose";
import { runCharacterAnalysis } from "@/lib/runCharacterAnalysis";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      obj_id,
      historyId,
      user_id,
      userPrompt,
      chosenPathNodes = [],
      acceptedAiRecommendation = false,
      email: bodyEmail,
    } = body || {};

    if (!chosenPathNodes || chosenPathNodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Chosen path node details are required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const targetEmail = (session?.user?.email || bodyEmail)?.toLowerCase();

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. User email is missing." },
        { status: 401 }
      );
    }

    await connectDb();

    // Link/refer to UserHistory document if exists
    const userDoc = await UserHistory.findOne({ email: targetEmail });

    // Format chosenPath as an array of step objects with robust fallbacks
    const formattedChosenPath = chosenPathNodes.map((n, idx) => {
      const pathId = n?.id || n?.pathId || `node_${idx}`;
      const pathName = n?.data?.label || n?.label || n?.pathName || "Node Title";
      const story = n?.data?.msg || n?.data?.description || n?.msg || n?.description || n?.story || "";
      const category = n?.data?.category || n?.category || "mindset";
      const probability = n?.data?.probability !== undefined ? n?.data?.probability : n?.probability;

      return {
        pathId: String(pathId),
        pathName: String(pathName),
        story: String(story),
        category: String(category),
        probability: probability !== undefined ? probability : null,
      };
    });

    const targetObjId = obj_id || historyId || user_id || null;
    const validObjId =
      targetObjId && mongoose.Types.ObjectId.isValid(targetObjId)
        ? targetObjId
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
      // Check if a decision item with this obj_id already exists for this user
      const existingRecord = await SavedDecision.findOne({
        email: targetEmail,
        "savedDecisions.obj_id": validObjId,
      });

      if (existingRecord) {
        // Update the existing decision item in place
        updatedDoc = await SavedDecision.findOneAndUpdate(
          { email: targetEmail, "savedDecisions.obj_id": validObjId },
          {
            $set: {
              userHistory: userDoc ? userDoc._id : null,
              "savedDecisions.$": newDecisionData,
            },
          },
          { returnDocument: "after" }
        );
      }
    }

    // If decision item for this obj_id does not exist yet, push new entry
    if (!updatedDoc) {
      updatedDoc = await SavedDecision.findOneAndUpdate(
        { email: targetEmail },
        {
          $set: {
            userHistory: userDoc ? userDoc._id : null,
          },
          $push: {
            savedDecisions: newDecisionData,
          },
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    // After save, trigger character analysis (only runs if decision IDs changed)
    let analysisResult = null;
    try {
      analysisResult = await runCharacterAnalysis(targetEmail);
    } catch (analysisErr) {
      console.error("Character analysis failed (non-blocking):", analysisErr.message);
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
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const targetEmail = session.user.email.toLowerCase();
    const { searchParams } = new URL(req.url);
    const obj_id = searchParams.get("obj_id");

    await connectDb();

    const savedDoc = await SavedDecision.findOne({ email: targetEmail });

    if (!savedDoc || !savedDoc.savedDecisions) {
      return NextResponse.json(
        { success: true, savedDecision: null, savedDecisions: [] },
        { status: 200 }
      );
    }

    if (obj_id) {
      const match = savedDoc.savedDecisions.find(
        (item) => item.obj_id && item.obj_id.toString() === obj_id.toString()
      );
      return NextResponse.json(
        { success: true, savedDecision: match || null, savedDecisions: savedDoc.savedDecisions },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, savedDecision: null, savedDecisions: savedDoc.savedDecisions },
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


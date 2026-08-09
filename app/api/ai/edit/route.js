import { getReactFlowMap, editSelectedPathNodes } from "@/lib/aiService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";
import mongoose from "mongoose";
import { rateLimit, getRateLimitKey, buildRateLimitBody } from "@/lib/rateLimit";

// 5 requests per 3 minutes for AI edit
const aiEditLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 5, name: "api-ai-edit" });

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to edit scenarios." },
        { status: 401 }
      );
    }

    // Rate limit check
    const rateLimitKey = getRateLimitKey(req, session);
    const { allowed, retryAfterMs } = aiEditLimiter.check(rateLimitKey);
    if (!allowed) {
      const { body, options } = buildRateLimitBody(retryAfterMs);
      return NextResponse.json(body, options);
    }

    const userEmail = session.user.email.toLowerCase();
    const body = await req.json();
    const {
      object_id,
      userPrompt,
      nodes = [],
      edges = [],
      selectedPathNodes = [],
      hasSelectedPath = false,
    } = body || {};

    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json(
        { success: false, error: "User prompt is required." },
        { status: 400 }
      );
    }

    let finalNodes = [];
    let finalEdges = [];
    let finalAdvice = null;

    // CASE 1: No selected path (hasSelectedPath is false) -> Regenerate entire scenario sequence
    if (!hasSelectedPath || !selectedPathNodes || selectedPathNodes.length === 0) {
      console.log("[API /api/ai/edit] No path selected -> Regenerating ENTIRE scenario sequence...");
      const fullMap = await getReactFlowMap(userPrompt);
      finalNodes = fullMap.output_1_paths || [];
      finalEdges = fullMap.output_2_flow_edges || [];
      finalAdvice = fullMap.output_3_recommendation_and_advice || null;
    } else {
      // CASE 2: There is a selected path -> Edit ONLY selected path nodes EXCEPT path0 (root node)
      console.log("[API /api/ai/edit] Selected path present -> Editing selected path EXCEPT path0...");
      const result = await editSelectedPathNodes(userPrompt, selectedPathNodes, nodes, edges);
      finalNodes = result.finalNodes;
      finalEdges = result.finalEdges;
      finalAdvice = result.finalAdvice;
    }

    // Save/Update MongoDB UserHistory Schema for this object_id / scenario
    let updatedHistoryId = object_id;

    try {
      await connectDb();

      const aiResponsePayload = {
        output_1_paths: finalNodes,
        output_2_flow_edges: finalEdges,
        output_3_recommendation_and_advice: finalAdvice,
      };

      if (object_id && mongoose.Types.ObjectId.isValid(object_id)) {
        await UserHistory.updateOne(
          { email: userEmail, "history._id": object_id },
          {
            $set: {
              "history.$.userPrompt": userPrompt,
              "history.$.ai_response": aiResponsePayload,
            },
          }
        );
      } else {
        // Fallback: update latest entry for user if object_id not provided or invalid
        const userDoc = await UserHistory.findOne({ email: userEmail });
        if (userDoc?.history?.length > 0) {
          const lastIndex = userDoc.history.length - 1;
          updatedHistoryId = userDoc.history[lastIndex]._id.toString();
          userDoc.history[lastIndex].userPrompt = userPrompt;
          userDoc.history[lastIndex].ai_response = aiResponsePayload;
          await userDoc.save();
        }
      }
    } catch (dbError) {
      console.error("Error updating scenario in MongoDB UserHistory:", dbError);
    }

    return NextResponse.json(
      {
        success: true,
        _id: updatedHistoryId,
        userPrompt: userPrompt,
        data: {
          output_1_paths: finalNodes,
          output_2_flow_edges: finalEdges,
          output_3_recommendation_and_advice: finalAdvice,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/ai/edit:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

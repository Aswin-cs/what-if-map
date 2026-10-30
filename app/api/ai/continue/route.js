import { generateStoryContinuation } from "@/lib/aiService";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { authenticateAndRateLimit, saveOrUpdateUserHistory } from "@/lib/aiRouteUtils";

// 5 requests per 3 minutes for AI story continuation
const continueLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 5, name: "api-ai-continue" });

export async function POST(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req, continueLimiter);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      historyId,
      userPrompt,
      endNodeId,
      endNodeLabel,
      endNodeStory,
      chosenPath = [],
      existingNodes = [],
      existingEdges = [],
    } = body || {};

    if (!endNodeId) {
      return NextResponse.json(
        { success: false, error: "endNodeId is required to continue the story." },
        { status: 400 }
      );
    }

    const continuationResult = await generateStoryContinuation({
      userPrompt,
      endNodeId,
      endNodeLabel,
      endNodeStory,
      chosenPath,
      existingNodes,
      existingEdges,
    });

    const {
      newNodes,
      newEdges,
      allNodes,
      allEdges,
      updatedAdvice,
      output_3_recommendation_and_advice,
    } = continuationResult;

    // Save updated graph & recommendations into MongoDB UserHistory
    await saveOrUpdateUserHistory({
      userEmail,
      historyId,
      aiResponse: {
        output_1_paths: allNodes,
        output_2_flow_edges: allEdges,
        output_3_recommendation_and_advice,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Story path continued successfully!",
        newNodes,
        newEdges,
        allNodes,
        allEdges,
        updatedAdvice,
        output_3_recommendation_and_advice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error continuing story path:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

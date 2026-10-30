import { getReactFlowMap, editSelectedPathNodes } from "@/lib/aiService";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { authenticateAndRateLimit, saveOrUpdateUserHistory } from "@/lib/aiRouteUtils";

// 20 requests per 3 minutes for AI edit
const aiEditLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 20, name: "api-ai-edit" });

export async function POST(req) {
  try {
    console.log("[API /api/ai/edit] Endpoint called");
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req, aiEditLimiter);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      object_id,
      userPrompt,
      oldUserPrompt,
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
    let promptToSave = userPrompt;

    // CASE 1: No selected path -> Regenerate entire scenario sequence with new user prompt
    if (!hasSelectedPath || !selectedPathNodes || selectedPathNodes.length === 0) {
      console.log("[API /api/ai/edit] No path selected -> Regenerating ENTIRE scenario sequence...");
      const fullMap = await getReactFlowMap(userPrompt);
      finalNodes = fullMap.output_1_paths || [];
      finalEdges = fullMap.output_2_flow_edges || [];
      finalAdvice = fullMap.output_3_recommendation_and_advice || null;
      promptToSave = userPrompt;
    } else {
      // CASE 2: Selected path present -> Edit ONLY selected path nodes, keep original scenario prompt in DB
      console.log("[API /api/ai/edit] Selected path present -> Editing selected path EXCEPT path0...");
      const result = await editSelectedPathNodes(userPrompt, selectedPathNodes, nodes, edges);
      finalNodes = result.finalNodes;
      finalEdges = result.finalEdges;
      finalAdvice = result.finalAdvice;
      // Retain original scenario prompt title in MongoDB when editing a path
      promptToSave = oldUserPrompt || userPrompt;
    }

    const aiResponsePayload = {
      output_1_paths: finalNodes,
      output_2_flow_edges: finalEdges,
      output_3_recommendation_and_advice: finalAdvice,
    };

    // Update existing MongoDB UserHistory item in place for the same object_id
    const updatedHistoryId = await saveOrUpdateUserHistory({
      userEmail,
      historyId: object_id,
      userPrompt: promptToSave,
      aiResponse: aiResponsePayload,
      createNew: false,
    });

    return NextResponse.json(
      {
        success: true,
        _id: updatedHistoryId || object_id,
        userPrompt: promptToSave,
        data: aiResponsePayload,
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

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";
import mongoose from "mongoose";
import { rateLimit, getRateLimitKey, buildRateLimitBody } from "@/lib/rateLimit";

// 5 requests per 3 minutes for AI story continuation
const continueLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 5, name: "api-ai-continue" });

const continuationResponseSchema = {
  type: "object",
  properties: {
    continuation_nodes: {
      type: "array",
      description: "2 to 4 new continuation nodes branching from the end node.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique string ID for continuation step" },
          label: { type: "string", description: "Short title of what happens next" },
          msg: { type: "string", description: "Detailed story outcome or next step description" },
          category: { type: "string", description: "mindset, action, risk, or outcome" }
        },
        required: ["id", "label", "msg"]
      }
    },
    output_3_recommendation_and_advice: {
      type: "object",
      description: "Updated AI recommendations and strategic advice considering the newly added story branches.",
      properties: {
        recommended_path_id: {
          type: "string",
          description: "ID of the single most optimal leaf node in the entire expanded tree."
        },
        recommended_lineage: {
          type: "array",
          description: "Complete ordered array of node IDs from root 'path0' all the way down to the recommended leaf node.",
          items: { type: "string" }
        },
        strategic_advice: {
          type: "string",
          description: "Strategic advice summarizing the optimal decision pathway."
        }
      },
      required: ["recommended_path_id", "recommended_lineage", "strategic_advice"]
    }
  },
  required: ["continuation_nodes", "output_3_recommendation_and_advice"]
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Rate limit check
    const rateLimitKey = getRateLimitKey(req, session);
    const { allowed, retryAfterMs } = continueLimiter.check(rateLimitKey);
    if (!allowed) {
      const { body, options } = buildRateLimitBody(retryAfterMs);
      return NextResponse.json(body, options);
    }

    const userEmail = session.user.email.toLowerCase();
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
    console.log(body);

    if (!endNodeId) {
      return NextResponse.json(
        { success: false, error: "endNodeId is required to continue the story." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const pathContext = chosenPath
      .map((step, idx) => `Step ${idx + 1}: [ID: ${step.id}] ${step.label || step.pathName || step.id} - ${step.msg || step.story || ''}`)
      .join("\n");

    const prompt = `
      You are an AI Decision Engine powering the "What-If" Map platform.
      The user has selected an end node in their scenario decision tree and wants to CONTINUE THE STORY / PATH beyond it.

      [INITIAL SCENARIO PROMPT]:
      ${userPrompt || 'Scenario Decision'}

      [FULL PATH TAKEN TO THIS POINT]:
      ${pathContext || `End node: ${endNodeLabel}`}

      [END NODE TO CONTINUE FROM]:
      Node ID: ${endNodeId}
      Title: ${endNodeLabel || endNodeId}
      Story/Details: ${endNodeStory || 'N/A'}

      [TASK]:
      1. Generate 2 to 4 logical, creative, and distinct next-step continuation outcomes extending from this end node ('${endNodeId}').
         Ensure each continuation item has a unique ID starting with '${endNodeId}_ext_' (e.g. '${endNodeId}_ext1', '${endNodeId}_ext2').
      2. Provide 'output_3_recommendation_and_advice' with:
         - 'recommended_path_id': ID of the best leaf node in the expanded tree.
         - 'recommended_lineage': Complete ordered array of node IDs from root 'path0' down to the recommended leaf node.
         - 'strategic_advice': Strategic guidance evaluating the entire updated decision landscape.
    `;

    const models = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3-preview", "gemini-2.5-flash"];
    let response = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: continuationResponseSchema,
            temperature: 0.7,
          },
        });
        if (response) break;
      } catch (err) {
        console.warn(`[Continue API] Model '${modelName}' failed:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw new Error(`AI model failed to generate story continuation: ${lastError?.message || lastError}`);
    }

    const result = JSON.parse(response.text);
    const rawContinuationNodes = result.continuation_nodes || [];
    const recommendationAndAdvice = result.output_3_recommendation_and_advice || {
      recommended_path_id: String(endNodeId),
      recommended_lineage: chosenPath.map(p => String(p.id)),
      strategic_advice: result.updated_advice || "No strategic advice provided."
    };
    const updatedAdvice = recommendationAndAdvice.strategic_advice;

    // Find position of the end node in existingNodes
    const targetEndNode = existingNodes.find(n => n.id === endNodeId);
    const baseX = targetEndNode?.position?.x !== undefined ? targetEndNode.position.x + 280 : 600;
    const baseY = targetEndNode?.position?.y !== undefined ? targetEndNode.position.y : 380;
    const count = rawContinuationNodes.length;

    const newNodes = [];
    const newEdges = [];

    rawContinuationNodes.forEach((item, idx) => {
      const newId = item.id ? String(item.id) : `${endNodeId}_ext${idx + 1}`;
      const offsetY = (idx - (count - 1) / 2) * 160;

      const nodeObj = {
        id: newId,
        type: "custom",
        position: {
          x: Math.round(baseX),
          y: Math.round(baseY + offsetY),
        },
        data: {
          label: item.label || `Outcome ${idx + 1}`,
          msg: item.msg || "",
          node_type: "subpath",
          parent_id: String(endNodeId),
          category: item.category || "mindset",
        },
      };

      const edgeObj = {
        id: `e-${endNodeId}-${newId}`,
        source: String(endNodeId),
        target: newId,
        sourceHandle: "source-right",
        targetHandle: "target-left",
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        markerEnd: { type: "arrowclosed", color: "#3b82f6" },
      };

      newNodes.push(nodeObj);
      newEdges.push(edgeObj);
    });

    const allNodes = [...existingNodes, ...newNodes];
    const allEdges = [...existingEdges, ...newEdges];

    // Save updated graph & recommendations into MongoDB UserHistory
    try {
      await connectDb();
      if (historyId && mongoose.Types.ObjectId.isValid(historyId)) {
        await UserHistory.updateOne(
          { email: userEmail, "history._id": historyId },
          {
            $set: {
              "history.$.ai_response.output_1_paths": allNodes,
              "history.$.ai_response.output_2_flow_edges": allEdges,
              "history.$.ai_response.output_3_recommendation_and_advice": recommendationAndAdvice,
            },
          }
        );
      } else {
        // Fallback: update the latest history item for the user
        const userDoc = await UserHistory.findOne({ email: userEmail });
        if (userDoc?.history?.length > 0) {
          const lastIndex = userDoc.history.length - 1;
          userDoc.history[lastIndex].ai_response.output_1_paths = allNodes;
          userDoc.history[lastIndex].ai_response.output_2_flow_edges = allEdges;
          userDoc.history[lastIndex].ai_response.output_3_recommendation_and_advice = recommendationAndAdvice;
          await userDoc.save();
        }
      }
    } catch (dbErr) {
      console.error("Non-blocking DB update error in continue story route:", dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Story path continued successfully!",
        newNodes,
        newEdges,
        allNodes,
        allEdges,
        updatedAdvice,
        output_3_recommendation_and_advice: recommendationAndAdvice,
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

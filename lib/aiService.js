import { GoogleGenAI } from "@google/genai";
import { reactFlowMapSchema } from "@/models/ReactFlowMapSchema";

const AI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-preview",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",

];

// Schema for updating only selected path nodes (excluding root path0)
const editSelectedPathSchema = {
  type: "object",
  properties: {
    updated_path_nodes: {
      type: "array",
      description: "Array of updated node objects for the selected path, excluding path0 (the root node).",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Node ID matching the existing path node ID" },
          label: { type: "string", description: "Updated short title of the path step" },
          msg: { type: "string", description: "Updated detailed story outcome for this step reflecting the new user prompt" },
          category: { type: "string", description: "mindset, action, risk, or outcome" },
        },
        required: ["id", "label", "msg"],
      },
    },
    output_3_recommendation_and_advice: {
      type: "object",
      description: "Updated AI recommendations and strategic advice considering the edited path.",
      properties: {
        recommended_path_id: { type: "string" },
        recommended_lineage: { type: "array", items: { type: "string" } },
        strategic_advice: { type: "string" },
      },
      required: ["recommended_path_id", "recommended_lineage", "strategic_advice"],
    },
  },
  required: ["updated_path_nodes", "output_3_recommendation_and_advice"],
};

// Schema for continuing story beyond an end node
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
          category: { type: "string", description: "mindset, action, risk, or outcome" },
        },
        required: ["id", "label", "msg"],
      },
    },
    output_3_recommendation_and_advice: {
      type: "object",
      description: "Updated AI recommendations and strategic advice considering the newly added story branches.",
      properties: {
        recommended_path_id: {
          type: "string",
          description: "ID of the single most optimal leaf node in the entire expanded tree.",
        },
        recommended_lineage: {
          type: "array",
          description: "Complete ordered array of node IDs from root 'path0' all the way down to the recommended leaf node.",
          items: { type: "string" },
        },
        strategic_advice: {
          type: "string",
          description: "Strategic advice summarizing the optimal decision pathway.",
        },
      },
      required: ["recommended_path_id", "recommended_lineage", "strategic_advice"],
    },
  },
  required: ["continuation_nodes", "output_3_recommendation_and_advice"],
};

/**
 * Generic helper to execute Google GenAI prompt with model fallback list.
 */
export async function callGeminiWithFallback({ prompt, schema, temperature = 0.7 }) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  let response = null;
  let lastError = null;

  for (const modelName of AI_MODELS) {
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature,
        },
      });
      if (response) break;
    } catch (err) {
      console.warn(`[AI Service] Model '${modelName}' failed:`, err.message || err);
      lastError = err;
    }
  }

  if (!response) {
    throw new Error(`All AI models failed. Last error: ${lastError?.message || lastError}`);
  }

  return JSON.parse(response.text);
}

/**
 * Generates a complete ReactFlow scenario map from a user prompt.
 */
export async function getReactFlowMap(userPrompt) {
  const systemInstructions = `
    You are an AI Decision Engine powering the "What-If" Map platform.
    Analyze the scenario and generate 2 to 5 primary main paths ('path1', 'path2', etc.).
    
    RULES FOR NESTED SUBPATHS:
    - Subpaths are OPTIONAL. Only add subpaths if the path naturally breaks down into secondary choices or outcomes.
    - If adding subpaths, use hierarchical dot notation for IDs:
      * Main paths: 'path1', 'path2'
      * Level 1 subpaths: 'subpath1.1', 'subpath1.2'
      * Level 2 subpaths: 'subpath1.1.1', 'subpath1.1.2'
    - Set 'has_subpaths' to true if 'subpaths' array is present, otherwise false.
    [SECTION RULES]:
    - 'output_1_paths': Nodes array starting at path0 (x: 50, y: 380), give space between nodes. x-y values should be in multiples of 80 or 150.
    - 'output_2_flow_edges': Edges connecting parent nodes to child nodes.
    - 'output_3_recommendation_and_advice': Best lineage and strategic advice.

    [EDGE CREATION RULES]:
    - For every non-root node (source -> target), create a corresponding edge in 'output_2_flow_edges'.
    - Edge ID format: 'e-{source_id}-{target_id}' (e.g. 'e-path0-path1').
    - Set 'sourceHandle': 'source-right' and 'targetHandle': 'target-left'.
    - Default edge style: stroke: '#52525b', strokeWidth: 2, markerEnd type: 'arrowclosed', color: '#71717a'.
    - Highlight recommended lineage edges with stroke: '#22c55e' and marker color: '#22c55e'.
  `;

  return await callGeminiWithFallback({
    prompt: `${systemInstructions}\n\nScenario: ${userPrompt}`,
    schema: reactFlowMapSchema,
    temperature: 0.7,
  });
}

/**
 * Edits only downstream nodes along a selected path (excluding root path0).
 */
export async function editSelectedPathNodes(userPrompt, selectedPathNodes, nodes, edges) {
  const rootNode = selectedPathNodes[0];
  const pathNodesToEdit = selectedPathNodes.slice(1);

  const pathContext = selectedPathNodes
    .map(
      (n, idx) =>
        `Step ${idx} [${n.id === rootNode?.id ? "ROOT / PATH 0 (DO NOT EDIT)" : "CAN BE EDITED"}]: ID=${n.id}, Title="${n.data?.label || n.id
        }", Details="${n.data?.msg || n.data?.description || ""}"`
    )
    .join("\n");

  const editPrompt = `
    You are an AI Decision Engine powering the "What-If" Map platform.
    The user has edited their overall scenario prompt to: "${userPrompt}".

    [CURRENT SELECTED DECISION PATH]:
    ${pathContext}

    [RULES FOR EDITING]:
    1. PATH 0 (Root Node '${rootNode?.id || "path0"}') MUST REMAIN UNCHANGED and fixed as the starting anchor. DO NOT edit or return Path 0 in 'updated_path_nodes'.
    2. ONLY edit the downstream nodes along the selected path (nodes from Step 1 onwards: ${pathNodesToEdit
      .map((n) => n.id)
      .join(", ")}).
    3. Update each downstream node's 'label', 'msg' (story details), and 'category' so that the narrative reflects the new user prompt ("${userPrompt}").
    4. Keep the exact same Node IDs ('${pathNodesToEdit
      .map((n) => n.id)
      .join("', '")}') so the existing graph connections and positions remain intact.
    5. Provide updated 'output_3_recommendation_and_advice' reflecting the modified scenario landscape.
  `;

  const result = await callGeminiWithFallback({
    prompt: editPrompt,
    schema: editSelectedPathSchema,
    temperature: 0.7,
  });

  const updatedPathItems = result.updated_path_nodes || [];
  const finalAdvice = result.output_3_recommendation_and_advice || null;

  const updatedMap = {};
  updatedPathItems.forEach((item) => {
    if (item.id && item.id !== rootNode?.id) {
      updatedMap[item.id] = item;
    }
  });

  const finalNodes = nodes.map((n) => {
    if (n.id !== rootNode?.id && updatedMap[n.id]) {
      return {
        ...n,
        data: {
          ...n.data,
          label: updatedMap[n.id].label || n.data?.label || n.id,
          msg: updatedMap[n.id].msg || n.data?.msg || n.data?.description || "",
          category: updatedMap[n.id].category || n.data?.category || "action",
        },
      };
    }
    return n;
  });

  return {
    finalNodes,
    finalEdges: edges,
    finalAdvice,
  };
}

/**
 * Generates story continuation nodes extending from a target end node.
 */
export async function generateStoryContinuation({
  userPrompt,
  endNodeId,
  endNodeLabel,
  endNodeStory,
  chosenPath = [],
  existingNodes = [],
  existingEdges = [],
}) {
  const pathContext = chosenPath
    .map(
      (step, idx) =>
        `Step ${idx + 1}: [ID: ${step.id}] ${step.label || step.pathName || step.id} - ${step.msg || step.story || ""
        }`
    )
    .join("\n");

  const prompt = `
    You are an AI Decision Engine powering the "What-If" Map platform.
    The user has selected an end node in their scenario decision tree and wants to CONTINUE THE STORY / PATH beyond it.

    [INITIAL SCENARIO PROMPT]:
    ${userPrompt || "Scenario Decision"}

    [FULL PATH TAKEN TO THIS POINT]:
    ${pathContext || `End node: ${endNodeLabel}`}

    [END NODE TO CONTINUE FROM]:
    Node ID: ${endNodeId}
    Title: ${endNodeLabel || endNodeId}
    Story/Details: ${endNodeStory || "N/A"}

    [TASK]:
    1. Generate 2 to 4 logical, creative, and distinct next-step continuation outcomes extending from this end node ('${endNodeId}').
       Ensure each continuation item has a unique ID starting with '${endNodeId}_ext_' (e.g. '${endNodeId}_ext1', '${endNodeId}_ext2').
    2. Provide 'output_3_recommendation_and_advice' with:
       - 'recommended_path_id': ID of the best leaf node in the expanded tree.
       - 'recommended_lineage': Complete ordered array of node IDs from root 'path0' down to the recommended leaf node.
       - 'strategic_advice': Strategic guidance evaluating the entire updated decision landscape.
  `;

  const result = await callGeminiWithFallback({
    prompt,
    schema: continuationResponseSchema,
    temperature: 0.7,
  });

  const rawContinuationNodes = result.continuation_nodes || [];
  const recommendationAndAdvice = result.output_3_recommendation_and_advice || {
    recommended_path_id: String(endNodeId),
    recommended_lineage: chosenPath.map((p) => String(p.id)),
    strategic_advice: result.updated_advice || "No strategic advice provided.",
  };
  const updatedAdvice = recommendationAndAdvice.strategic_advice;

  const targetEndNode = existingNodes.find((n) => n.id === endNodeId);
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

  return {
    newNodes,
    newEdges,
    allNodes,
    allEdges,
    updatedAdvice,
    output_3_recommendation_and_advice: recommendationAndAdvice,
  };
}

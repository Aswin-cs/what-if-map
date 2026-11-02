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
 * Calculates hierarchical 2D node positions using the branching offset
 * method from generateStoryContinuation (baseX + 280, baseY + (idx - (count - 1) / 2) * spacing).
 */
export function calculateNodePositions(nodes = [], edges = []) {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes;

  // Build parent-child relationships
  const childrenMap = new Map();
  const parentMap = new Map();

  // 1. From edges (source -> target)
  if (Array.isArray(edges)) {
    edges.forEach((edge) => {
      if (edge.source && edge.target) {
        if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
        if (!childrenMap.get(edge.source).includes(edge.target)) {
          childrenMap.get(edge.source).push(edge.target);
        }
        parentMap.set(edge.target, edge.source);
      }
    });
  }

  // 2. From node.data.parent_id
  nodes.forEach((node) => {
    const pId = node.data?.parent_id;
    if (pId && !parentMap.has(node.id) && pId !== node.id) {
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      if (!childrenMap.get(pId).includes(node.id)) {
        childrenMap.get(pId).push(node.id);
      }
      parentMap.set(node.id, pId);
    }
  });

  // 3. Identify Root Node
  const rootNode =
    nodes.find((n) => n.id === "path0") ||
    nodes.find((n) => n.data?.node_type === "root") ||
    nodes.find((n) => !parentMap.has(n.id)) ||
    nodes[0];

  const rootId = rootNode?.id || "path0";

  // 4. Fallback hierarchy based on naming convention
  nodes.forEach((node) => {
    if (node.id === rootId) return;

    if (!parentMap.has(node.id)) {
      if (/^path\d+$/i.test(node.id) || node.data?.node_type === "main_path") {
        if (!childrenMap.has(rootId)) childrenMap.set(rootId, []);
        if (!childrenMap.get(rootId).includes(node.id)) {
          childrenMap.get(rootId).push(node.id);
        }
        parentMap.set(node.id, rootId);
      } else if (/^subpath(\d+)\./i.test(node.id)) {
        const parts = node.id.split(".");
        let parentCandidate = "";
        if (parts.length === 2) {
          const mainNum = parts[0].replace(/^subpath/i, "");
          parentCandidate = `path${mainNum}`;
        } else if (parts.length > 2) {
          parentCandidate = parts.slice(0, -1).join(".");
        }

        if (parentCandidate && nodes.some((n) => n.id === parentCandidate)) {
          if (!childrenMap.has(parentCandidate)) childrenMap.set(parentCandidate, []);
          if (!childrenMap.get(parentCandidate).includes(node.id)) {
            childrenMap.get(parentCandidate).push(node.id);
          }
          parentMap.set(node.id, parentCandidate);
        } else {
          const fallbackParent = nodes.find((n) => /^path\d+$/i.test(n.id))?.id || rootId;
          if (!childrenMap.has(fallbackParent)) childrenMap.set(fallbackParent, []);
          childrenMap.get(fallbackParent).push(node.id);
          parentMap.set(node.id, fallbackParent);
        }
      }
    }
  });

  const positions = new Map();
  // Set root anchor position
  positions.set(rootId, { x: 50, y: 380 });

  // Main paths spacing calculation: determine max subchildren to prevent branch overlap
  const mainChildren = childrenMap.get(rootId) || [];
  let maxSubChildren = 1;
  mainChildren.forEach((childId) => {
    const subCount = (childrenMap.get(childId) || []).length;
    if (subCount > maxSubChildren) maxSubChildren = subCount;
  });

  const mainSpacing = Math.max(220, maxSubChildren * 150);

  // Traverse tree level by level using BFS
  const queue = [rootId];
  const visited = new Set([rootId]);

  while (queue.length > 0) {
    const parentId = queue.shift();
    const parentPos = positions.get(parentId) || { x: 50, y: 380 };
    const rawChildren = childrenMap.get(parentId) || [];
    const children = rawChildren.filter((cId) => !visited.has(cId));

    const count = children.length;
    const isRootParent = parentId === rootId;
    const spacing = isRootParent ? mainSpacing : (count > 2 ? 140 : 160);
    const baseX = parentPos.x + 280;
    const baseY = parentPos.y;

    children.forEach((childId, idx) => {
      visited.add(childId);
      const offsetY = (idx - (count - 1) / 2) * spacing;
      positions.set(childId, {
        x: Math.round(baseX),
        y: Math.round(baseY + offsetY),
      });
      queue.push(childId);
    });
  }

  // Handle any remaining unvisited/orphan nodes
  nodes.forEach((node, idx) => {
    if (!positions.has(node.id)) {
      positions.set(node.id, {
        x: 330,
        y: Math.round(380 + (idx - nodes.length / 2) * 160),
      });
    }
  });

  // Assign computed positions back to nodes
  return nodes.map((node) => ({
    ...node,
    type: node.type || "custom",
    position: positions.get(node.id) || { x: 50, y: 380 },
  }));
}

/**
 * Generates a complete ReactFlow scenario map from a user prompt.
 */
export async function getReactFlowMap(userPrompt) {
  const systemInstructions = `
    You are an AI Decision Engine powering the "What-If" Map platform.
    Analyze the scenario and generate 2 to 5 primary main paths ('path1', 'path2', etc.).
    
    [CRITICAL & NEGATIVE THINKING RULES]:
    - Give significant importance to negative thinking, critical risks, and realistic downside scenarios.
    - If the scenario carries potential risks, negative implications, high-stakes decisions, or unintended pitfalls, ensure the decision tree critically explores cautionary pathways, failure modes, trade-offs, and worst-case consequences rather than just ideal outcomes.
    - Ground all negative branches in realistic causal chains showing why and how things could go wrong, helping the user anticipate blind spots and hidden liabilities.

    RULES FOR NESTED SUBPATHS:
    - Subpaths are OPTIONAL. Only add subpaths if the path naturally breaks down into secondary choices or outcomes.
    - If adding subpaths, use hierarchical dot notation for IDs:
      * Main paths: 'path1', 'path2'
      * Level 1 subpaths: 'subpath1.1', 'subpath1.2'
      * Level 2 subpaths: 'subpath1.1.1', 'subpath1.1.2'
    - Set 'has_subpaths' to true if 'subpaths' array is present, otherwise false.

    [SECTION RULES]:
    - 'output_1_paths': Nodes array representing the decision branches starting at root 'path0'. Provide id, type ('custom'), and data (label, msg, node_type, parent_id).
    - 'output_2_flow_edges': Edges connecting parent nodes to child nodes.
    - 'output_3_recommendation_and_advice': Best lineage and strategic advice.

    [EDGE CREATION RULES]:
    - For every non-root node (source -> target), create a corresponding edge in 'output_2_flow_edges'.
    - Edge ID format: 'e-{source_id}-{target_id}' (e.g. 'e-path0-path1').
    - Set 'sourceHandle': 'source-right' and 'targetHandle': 'target-left'.
    - Default edge style: stroke: '#52525b', strokeWidth: 2, markerEnd type: 'arrowclosed', color: '#71717a'.
    - Highlight recommended lineage edges with stroke: '#22c55e' and marker color: '#22c55e'.
  `;

  const result = await callGeminiWithFallback({
    prompt: `${systemInstructions}\n\nScenario: ${userPrompt}`,
    schema: reactFlowMapSchema,
    temperature: 0.7,
  });

  if (result && Array.isArray(result.output_1_paths)) {
    result.output_1_paths = calculateNodePositions(
      result.output_1_paths,
      result.output_2_flow_edges || []
    );
  }

  return result;
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

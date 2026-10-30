"use client";
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge,
  MiniMap, Controls, Background, Panel, MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomNode } from './customNode';
import DotGrid from './DotGrid';
import MapNavbar from './MapNavbar';
import MapLoader from './MapLoader';
import HiLoader from './HiLoader';
import AIAdvicePanel from './AIAdvicePanel';
import SelectedPathPanel from './SelectedPathPanel';
import GlassPromptEditor from './GlassPromptEditor';
import { useUserContext } from '../hooks/userContext';
import { useTheme } from '../hooks/ThemeContext';

const nodeTypes = { custom: CustomNode };
const BASELINE_Y = 380;

/* ─── Node Position Transformation Helper ─── */
function transformNodePositions(rawNodes = []) {
  if (!Array.isArray(rawNodes)) return [];
  return rawNodes.map((node) => {
    if (node._transformed) return node;
    const isSubpath = Boolean(node.data?.parent_id) || node.data?.node_type === 'subpath';
    const distFromCenter = (node.position?.y ?? BASELINE_Y) - BASELINE_Y;
    return {
      ...node,
      _transformed: true,
      position: {
        x: (node.position?.x ?? 0) * 1.25,
        y: isSubpath ? BASELINE_Y + distFromCenter * 1.5 : (node.position?.y ?? BASELINE_Y),
      },
    };
  });
}

export default function ScenarioMapView({ scenarioId = null, isLatestMode = false }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const {
    nodes: contextNodes, edges: contextEdges, flowData: contextAdvice,
    currentHistoryId, setCurrentHistoryId,
    setNodes: setContextNodes, setEdges: setContextEdges,
    userPrompt: contextUserPrompt, setUserPrompt: setContextUserPrompt,
    setFlowData: setContextFlowData
  } = useUserContext();

  const activeId = scenarioId || currentHistoryId;

  const [nodes, setNodes] = useState(isLatestMode ? transformNodePositions(contextNodes || []) : []);
  const [edges, setEdges] = useState(isLatestMode ? contextEdges || [] : []);
  const [recommendation, setRecommendation] = useState(isLatestMode ? contextAdvice || null : null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [scenarioPrompt, setScenarioPrompt] = useState(isLatestMode ? contextUserPrompt || '' : '');
  const [isAdviceOpen, setIsAdviceOpen] = useState(true);
  const [selectedPathInfo, setSelectedPathInfo] = useState(null);

  // Actions loading & success states
  const [savingPath, setSavingPath] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [undoingPath, setUndoingPath] = useState(false);
  const [undoSuccessMsg, setUndoSuccessMsg] = useState('');
  const [continuingStory, setContinuingStory] = useState(false);
  const [continueSuccessMsg, setContinueSuccessMsg] = useState('');
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [savedPathKey, setSavedPathKey] = useState(null);
  const [characterProfile, setCharacterProfile] = useState(null);

  /* ─── Auth guard ─── */
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  /* ─── Fetch character profile (if latest mode) ─── */
  useEffect(() => {
    if (status !== 'authenticated' || !isLatestMode) return;
    fetch('/api/ai/analysis')
      .then(r => r.json())
      .then(d => { if (d.success && d.profile) setCharacterProfile(d.profile); })
      .catch(() => {});
  }, [status, isLatestMode]);

  /* ─── Fetch Map Data ─── */
  useEffect(() => {
    if (status !== 'authenticated') return;

    async function loadScenarioData() {
      try {
        setLoading(true);
        setLoadError(null);

        if (!isLatestMode && scenarioId) {
          // Specific scenario by ID
          const res = await fetch(`/api/history/specific/${scenarioId}`);
          const data = await res.json();
          if (!data.success) {
            setLoadError(data.error || 'Failed to load scenario.');
            return;
          }
          const rawNodes = data.ai_response?.output_1_paths || [];
          const transformedNodes = transformNodePositions(rawNodes);
          const fetchedEdges = data.ai_response?.output_2_flow_edges || [];
          const fetchedAdvice = data.ai_response?.output_3_recommendation_and_advice || null;
          const fetchedPrompt = data.userPrompt || '';

          setNodes(transformedNodes);
          setEdges(fetchedEdges);
          setRecommendation(fetchedAdvice);
          setScenarioPrompt(fetchedPrompt);

          if (setCurrentHistoryId) setCurrentHistoryId(scenarioId);
          if (setContextNodes) setContextNodes(transformedNodes);
          if (setContextEdges) setContextEdges(fetchedEdges);
          if (setContextUserPrompt) setContextUserPrompt(fetchedPrompt);
          if (setContextFlowData) setContextFlowData(fetchedAdvice);
        } else if (isLatestMode) {
          // Latest scenario mode
          if (contextNodes && contextNodes.length > 0 && contextUserPrompt) {
            setNodes(transformNodePositions(contextNodes));
            if (contextEdges) setEdges(contextEdges);
            if (contextAdvice) setRecommendation(contextAdvice);
            setScenarioPrompt(contextUserPrompt);
            setLoading(false);
            return;
          }

          const res = await fetch('/api/history/latest');
          const data = await res.json();
          if (data.success && data.data) {
            const rawNodes = data.data.output_1_paths || [];
            const transformedNodes = transformNodePositions(rawNodes);
            const fetchedEdges = data.data.output_2_flow_edges || [];
            const fetchedAdvice = data.data.output_3_recommendation_and_advice || null;
            const fetchedPrompt = data.userPrompt || '';
            const fetchedId = data._id || data.historyId;

            setNodes(transformedNodes);
            setEdges(fetchedEdges);
            setRecommendation(fetchedAdvice);
            setScenarioPrompt(fetchedPrompt);

            if (setCurrentHistoryId && fetchedId) setCurrentHistoryId(fetchedId);
            if (setContextNodes) setContextNodes(transformedNodes);
            if (setContextEdges) setContextEdges(fetchedEdges);
            if (setContextUserPrompt) setContextUserPrompt(fetchedPrompt);
            if (setContextFlowData) setContextFlowData(fetchedAdvice);
          } else {
            setLoadError(data.error || 'No scenario history found.');
          }
        }
      } catch (err) {
        console.error('Error loading scenario map:', err);
        setLoadError('An unexpected error occurred while loading map.');
      } finally {
        setLoading(false);
      }
    }

    loadScenarioData();
    // eslint-disable-next-deps
  }, [status, scenarioId, isLatestMode]);

  /* ─── Fetch saved decision for current scenario ─── */
  useEffect(() => {
    if (status !== 'authenticated' || !activeId) { setSavedPathKey(null); return; }
    fetch(`/api/history/save-decision?obj_id=${activeId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.savedDecision?.chosenPath) {
          setSavedPathKey(d.savedDecision.chosenPath.map(s => s.pathId).filter(Boolean).join('->') || null);
        } else {
          setSavedPathKey(null);
        }
      })
      .catch(() => setSavedPathKey(null));
  }, [status, activeId]);

  /* ─── ReactFlow callbacks ─── */
  const onNodesChange = useCallback((changes) => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges(eds => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, style: { stroke: '#3b82f6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } }, eds));
  }, []);

  /* ─── Highlight helpers ─── */
  const goldEdgeStyle = { stroke: '#ffd700', strokeWidth: 3.5, filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.8))' };
  const dimEdgeStyle  = { stroke: '#52525b', strokeWidth: 2, filter: 'none' };

  const applyPathHighlight = useCallback((pathNodeSet, pathEdgeIds) => {
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isHighlighted: pathNodeSet.has(n.id) } })));
    setEdges(eds => eds.map(edge => pathEdgeIds.has(edge.id)
      ? { ...edge, animated: true, style: { ...edge.style, ...goldEdgeStyle }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ffd700' } }
      : { ...edge, animated: false, style: { ...edge.style, ...dimEdgeStyle }, markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' } }
    ));
  }, []);

  /* ─── Node click: trace & highlight path to root ─── */
  const handleNodeClick = useCallback((_, node) => {
    const isLeaf = !edges.some(e => e.source === node.id);
    if (!isLeaf) return;
    setIsAdviceOpen(true);

    const targetToEdge = {};
    edges.forEach(e => { targetToEdge[e.target] = e; });

    const pathEdgeIds = new Set();
    const orderedIds = [];
    let cur = node.id;
    orderedIds.unshift(cur);
    while (cur && targetToEdge[cur]) {
      const e = targetToEdge[cur];
      pathEdgeIds.add(e.id);
      cur = e.source;
      if (cur) orderedIds.unshift(cur);
    }

    applyPathHighlight(new Set(orderedIds), pathEdgeIds);

    const pathKey = orderedIds.join('->');
    const isAi = recommendation?.recommended_lineage &&
      JSON.stringify(orderedIds) === JSON.stringify(recommendation.recommended_lineage);
    setSelectedPathInfo({
      nodeIds: orderedIds,
      acceptedAi: Boolean(isAi),
      isSaved: savedPathKey === pathKey,
    });
    setSaveSuccessMsg('');
    setUndoSuccessMsg('');
    setContinueSuccessMsg('');
  }, [edges, recommendation, savedPathKey, applyPathHighlight]);

  /* ─── Pane click: reset highlights ─── */
  const handlePaneClick = useCallback(() => {
    setSelectedPathInfo(null);
    setSaveSuccessMsg('');
    setUndoSuccessMsg('');
    setContinueSuccessMsg('');
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isHighlighted: false } })));
    setEdges(eds => eds.map(e => ({ ...e, animated: false, style: { ...e.style, ...dimEdgeStyle }, markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' } })));
  }, []);

  /* ─── Accept AI recommendation ─── */
  const handleAcceptRecommendation = useCallback(() => {
    if (!recommendation?.recommended_lineage?.length) return;
    const lineage = recommendation.recommended_lineage;
    const pairSet = new Set(lineage.slice(0, -1).map((id, i) => `${id}->${lineage[i + 1]}`));
    const pathEdgeIds = new Set(edges.filter(e => pairSet.has(`${e.source}->${e.target}`)).map(e => e.id));
    applyPathHighlight(new Set(lineage), pathEdgeIds);
    const pathKey = lineage.join('->');
    setSelectedPathInfo({
      nodeIds: lineage,
      acceptedAi: true,
      isSaved: savedPathKey === pathKey,
    });
    setSaveSuccessMsg('');
    setUndoSuccessMsg('');
    setContinueSuccessMsg('');
  }, [recommendation, savedPathKey, edges, applyPathHighlight]);

  /* ─── Save decision path ─── */
  const handleSaveDecision = useCallback(async () => {
    if (!selectedPathInfo?.nodeIds?.length || !activeId) return;
    setSavingPath(true);
    setSaveSuccessMsg('');
    try {
      const nodeMap = {};
      nodes.forEach(n => { nodeMap[n.id] = n; });
      const res = await fetch('/api/history/save-decision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obj_id: activeId, historyId: activeId,
          userPrompt: scenarioPrompt || 'Scenario Decision',
          chosenPathNodes: selectedPathInfo.nodeIds.map(id => nodeMap[id]).filter(Boolean),
          acceptedAiRecommendation: selectedPathInfo.acceptedAi,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg('Decision Path Saved!');
        const newKey = selectedPathInfo.nodeIds.join('->');
        setSavedPathKey(newKey);
        setSelectedPathInfo(prev => prev ? { ...prev, isSaved: true } : null);
        if (data.analysis?.profile) setCharacterProfile(data.analysis.profile);
        setTimeout(() => { setSaveSuccessMsg(''); }, 1500);
      } else {
        alert(data.error || 'Failed to save decision path.');
      }
    } catch { alert('An error occurred while saving decision path.'); }
    finally { setSavingPath(false); }
  }, [selectedPathInfo, nodes, scenarioPrompt, activeId]);

  /* ─── Undo decision ─── */
  const handleUndoDecision = useCallback(async () => {
    if (!activeId) return;
    setUndoingPath(true);
    setUndoSuccessMsg('');
    try {
      const res = await fetch(`/api/history/save-decision?obj_id=${activeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setUndoSuccessMsg('Decision Unsaved!');
        setSavedPathKey(null);
        setSelectedPathInfo(prev => prev ? { ...prev, isSaved: false } : null);
        if (data.analysis?.profile) setCharacterProfile(data.analysis.profile);
        setTimeout(() => { setUndoSuccessMsg(''); }, 1500);
      } else {
        alert(data.error || 'Failed to undo decision save.');
      }
    } catch { alert('An error occurred while undoing decision save.'); }
    finally { setUndoingPath(false); }
  }, [activeId]);

  /* ─── Continue Story / Path ─── */
  const handleContinueStory = useCallback(async () => {
    if (!selectedPathInfo?.nodeIds?.length || continuingStory || !activeId) return;
    const endNodeId = selectedPathInfo.nodeIds[selectedPathInfo.nodeIds.length - 1];
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });
    const endNode = nodeMap[endNodeId];
    if (!endNode) return;

    setContinuingStory(true);
    setContinueSuccessMsg('');

    try {
      const res = await fetch('/api/ai/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyId: activeId,
          userPrompt: scenarioPrompt,
          endNodeId: endNode.id,
          endNodeLabel: endNode.data?.label || endNode.id,
          endNodeStory: endNode.data?.msg || endNode.data?.description || '',
          chosenPath: selectedPathInfo.nodeIds.map(id => nodeMap[id]).filter(Boolean),
          existingNodes: nodes,
          existingEdges: edges,
        }),
      });

      const data = await res.json();
      if (data.success && data.allNodes) {
        const transformedNodes = transformNodePositions(data.allNodes).map(n => ({
          ...n,
          data: { ...n.data, isHighlighted: false }
        }));
        const unhighlightedEdges = (data.allEdges || edges).map(e => ({
          ...e,
          animated: false,
          style: { stroke: '#52525b', strokeWidth: 2, filter: 'none' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' }
        }));

        setNodes(transformedNodes);
        if (setContextNodes) setContextNodes(transformedNodes);

        setEdges(unhighlightedEdges);
        if (setContextEdges) setContextEdges(unhighlightedEdges);

        if (data.output_3_recommendation_and_advice) {
          setRecommendation(data.output_3_recommendation_and_advice);
        } else if (data.updatedAdvice) {
          setRecommendation(prev => prev ? { ...prev, strategic_advice: data.updatedAdvice } : prev);
        }

        // Deselect node/path and clear highlight
        setSelectedPathInfo(null);
        setSaveSuccessMsg('');
        setUndoSuccessMsg('');
        setContinueSuccessMsg('');
      } else {
        alert(data.error || 'Failed to continue story path.');
      }
    } catch (err) {
      console.error('Error continuing story:', err);
      alert('An error occurred while continuing the story path.');
    } finally {
      setContinuingStory(false);
    }
  }, [selectedPathInfo, nodes, edges, scenarioPrompt, activeId, continuingStory, setContextNodes, setContextEdges]);

  /* ─── Export / Share ─── */
  const handleExport = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ nodes, edges, recommendation }, null, 2));
    a.download = `whatif_${activeId || 'map'}.json`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Map link copied to clipboard!');
    }
  };

  /* ══════════════════════════════════════════════ */
  if (status === 'loading' || loading || loadError) {
    return isLatestMode ? <HiLoader isUnauth={status === 'unauthenticated'} /> : <MapLoader loadError={loadError} />;
  }

  /* ══════════════════════════════════════════════ */
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: 'var(--map-bg)', overflow: 'hidden', transition: 'background-color 0.3s ease' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <DotGrid dotSize={3} gap={15} baseColor={isLight ? '#cbd5e1' : '#2F293A'} activeColor={isLight ? '#7c3aed' : '#8b5cf6'}
          proximity={120} shockRadius={250} shockStrength={5} resistance={750} returnDuration={1.5} />
      </div>

      {/* Navbar */}
      <MapNavbar
        scenarioPrompt={scenarioPrompt}
        session={session}
        onExport={handleExport}
        onShare={handleShare}
      />

      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeClick={handleNodeClick} onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes} fitView colorMode={isLight ? 'light' : 'dark'}
        style={{ background: 'transparent' }}
      >
        <Background color={isLight ? 'rgba(100,116,139,0.35)' : 'rgba(113,113,122,0.4)'} bgColor="transparent" variant="dots" gap={28} size={1.2} />

        <Panel position="top-left" style={{ marginTop: '80px', marginLeft: '24px', maxWidth: '370px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AIAdvicePanel
            recommendation={recommendation}
            isOpen={isAdviceOpen}
            onToggle={() => setIsAdviceOpen(v => !v)}
            onAccept={handleAcceptRecommendation}
          />
          <SelectedPathPanel
            selectedPathInfo={selectedPathInfo}
            savingPath={savingPath}
            saveSuccessMsg={saveSuccessMsg}
            onSave={handleSaveDecision}
            undoingPath={undoingPath}
            undoSuccessMsg={undoSuccessMsg}
            onUndo={handleUndoDecision}
            onContinueStory={handleContinueStory}
            continuingStory={continuingStory}
            continueSuccessMsg={continueSuccessMsg}
            isEditingSubmitting={isEditingSubmitting}
          />
        </Panel>

        <Controls position="bottom-right" style={{ marginBottom: '20px', marginRight: '20px' }} />
        <MiniMap position="top-right" style={{ marginTop: '82px', marginRight: '20px' }}
          nodeColor={n => n.data?.isHighlighted ? '#ffd700' : '#8b5cf6'}
        />
      </ReactFlow>

      {/* Floating Glassmorphic Scenario Prompt & Selected Path Editor */}
      <GlassPromptEditor
        currentPrompt={scenarioPrompt}
        historyId={activeId}
        onPromptUpdated={(newPrompt, newData) => {
          setScenarioPrompt(newPrompt);
          if (newData) {
            const rawNodes = newData.output_1_paths || [];
            const transformedNodes = transformNodePositions(rawNodes);
            const newEdges = newData.output_2_flow_edges || [];
            const newAdvice = newData.output_3_recommendation_and_advice || null;

            setNodes(transformedNodes);
            setEdges(newEdges);
            setRecommendation(newAdvice);
            setSelectedPathInfo(null);

            if (setContextNodes) setContextNodes(transformedNodes);
            if (setContextEdges) setContextEdges(newEdges);
            if (setContextUserPrompt) setContextUserPrompt(newPrompt);
            if (setContextFlowData) setContextFlowData(newAdvice);
          }
        }}
        selectedPathInfo={selectedPathInfo}
        nodes={nodes}
        edges={edges}
        onSaveDecision={handleSaveDecision}
        savingPath={savingPath}
        saveSuccessMsg={saveSuccessMsg}
        onUndoDecision={handleUndoDecision}
        undoingPath={undoingPath}
        undoSuccessMsg={undoSuccessMsg}
        onContinueStory={handleContinueStory}
        continuingStory={continuingStory}
        continueSuccessMsg={continueSuccessMsg}
        onSubmittingChange={setIsEditingSubmitting}
      />
    </div>
  );
}

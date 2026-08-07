"use client";
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge,
  MiniMap, Controls, Background, Panel, MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomNode } from '../components/customNode';
import DotGrid from '../components/DotGrid';
import MapNavbar from '../components/MapNavbar';
import HiLoader from '../components/HiLoader';
import AIAdvicePanel from '../components/AIAdvicePanel';
import SelectedPathPanel from '../components/SelectedPathPanel';
import { useUserContext } from '../hooks/userContext';

const nodeTypes = { custom: CustomNode };

export default function App() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    nodes: contextNodes, edges: contextEdges, flowData: contextAdvice,
    currentHistoryId, setCurrentHistoryId,
    setNodes: setContextNodes, setEdges: setContextEdges,
    userPrompt: contextUserPrompt,
  } = useUserContext();

  const [nodes, setNodes] = useState(contextNodes || []);
  const [edges, setEdges] = useState(contextEdges || []);
  const [recommendation, setRecommendation] = useState(contextAdvice || null);
  const [loading, setLoading] = useState(true);
  const [scenarioPrompt, setScenarioPrompt] = useState(contextUserPrompt);
  const [isAdviceOpen, setIsAdviceOpen] = useState(true);
  const [selectedPathInfo, setSelectedPathInfo] = useState(null);
  const [savingPath, setSavingPath] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savedPathKey, setSavedPathKey] = useState(null);
  const [characterProfile, setCharacterProfile] = useState(null);

  /* ─── Fetch character profile ─── */
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/ai/analysis')
      .then(r => r.json())
      .then(d => { if (d.success && d.profile) setCharacterProfile(d.profile); })
      .catch(err => console.error('Failed to fetch character profile:', err));
  }, [status]);

  /* ─── Auth guard + load latest/context data ─── */
  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;

    async function fetchLatestHistory() {
      try {
        setLoading(true);
        // If context was just populated by a fresh AI submission, use it directly
        if (contextNodes && contextNodes.length > 0) {
          setNodes(contextNodes);
          if (contextEdges) setEdges(contextEdges);
          if (contextAdvice) setRecommendation(contextAdvice);
          setLoading(false);
          return;
        }
        // Otherwise fall back to fetching the latest history entry
        const res = await fetch('/api/history/latest');
        const data = await res.json();
        if (data.success && data.data) {
          const rawNodes = data.data.output_1_paths || [];
          const BASELINE_Y = 380;
          const transformedNodes = rawNodes.map((node) => {
            const isSubpath = Boolean(node.data?.parent_id) || node.data?.node_type === 'subpath';
            const distFromCenter = node.position.y - BASELINE_Y;
            return {
              ...node,
              position: {
                x: node.position.x * 1.25,
                y: isSubpath ? BASELINE_Y + distFromCenter * 1.5 : node.position.y,
              },
            };
          });
          const fetchedEdges = data.data.output_2_flow_edges || [];
          const fetchedAdvice = data.data.output_3_recommendation_and_advice || null;
          setNodes(transformedNodes);
          setEdges(fetchedEdges);
          setRecommendation(fetchedAdvice);
          setScenarioPrompt(data.userPrompt || '');
          if (setCurrentHistoryId && (data._id || data.historyId)) setCurrentHistoryId(data._id || data.historyId);
          if (setContextNodes) setContextNodes(transformedNodes);
          if (setContextEdges) setContextEdges(fetchedEdges);
        }
      } catch (err) {
        console.error('Failed to fetch latest scenario history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatestHistory();
  }, [status, router, contextNodes, contextEdges, contextAdvice, setCurrentHistoryId, setContextNodes, setContextEdges]);

  /* ─── Fetch saved decision for current scenario ─── */
  useEffect(() => {
    if (status !== 'authenticated' || !currentHistoryId) { setSavedPathKey(null); return; }
    fetch(`/api/history/save-decision?obj_id=${currentHistoryId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.savedDecision?.chosenPath) {
          setSavedPathKey(d.savedDecision.chosenPath.map(s => s.pathId).filter(Boolean).join('->') || null);
        } else {
          setSavedPathKey(null);
        }
      })
      .catch(() => setSavedPathKey(null));
  }, [status, currentHistoryId]);

  /* ─── ReactFlow callbacks ─── */
  const onNodesChange = useCallback((changes) => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges(eds => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, style: { stroke: '#3b82f6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } }, eds));
  }, []);

  /* ─── Shared highlight helpers ─── */
  const goldEdge = { stroke: '#ffd700', strokeWidth: 3.5, filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.8))' };
  const dimEdge  = { stroke: '#52525b', strokeWidth: 2, filter: 'none' };

  const applyPathHighlight = useCallback((pathNodeSet, pathEdgeIds) => {
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isHighlighted: pathNodeSet.has(n.id) } })));
    setEdges(eds => eds.map(e => pathEdgeIds.has(e.id)
      ? { ...e, animated: true,  style: { ...e.style, ...goldEdge }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ffd700' } }
      : { ...e, animated: false, style: { ...e.style, ...dimEdge  }, markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' } }
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
    setSelectedPathInfo(savedPathKey !== pathKey ? { nodeIds: orderedIds, acceptedAi: Boolean(isAi) } : null);
    setSaveSuccessMsg('');
  }, [edges, recommendation, savedPathKey, applyPathHighlight]);

  /* ─── Pane click: reset highlights ─── */
  const handlePaneClick = useCallback(() => {
    setSelectedPathInfo(null);
    setSaveSuccessMsg('');
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isHighlighted: false } })));
    setEdges(eds => eds.map(e => ({ ...e, animated: false, style: { ...e.style, ...dimEdge }, markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' } })));
  }, []);

  /* ─── Accept AI recommendation ─── */
  const handleAcceptRecommendation = useCallback(() => {
    if (!recommendation?.recommended_lineage?.length) return;
    const lineage = recommendation.recommended_lineage;
    const pairSet = new Set(lineage.slice(0, -1).map((id, i) => `${id}->${lineage[i + 1]}`));
    const pathEdgeIds = new Set(edges.filter(e => pairSet.has(`${e.source}->${e.target}`)).map(e => e.id));
    applyPathHighlight(new Set(lineage), pathEdgeIds);
    const pathKey = lineage.join('->');
    setSelectedPathInfo(savedPathKey !== pathKey ? { nodeIds: lineage, acceptedAi: true } : null);
    setSaveSuccessMsg('');
  }, [recommendation, savedPathKey, edges, applyPathHighlight]);

  /* ─── Save decision path ─── */
  const handleSaveDecision = useCallback(async () => {
    if (!selectedPathInfo?.nodeIds?.length) return;
    setSavingPath(true);
    setSaveSuccessMsg('');
    try {
      const nodeMap = {};
      nodes.forEach(n => { nodeMap[n.id] = n; });
      const res = await fetch('/api/history/save-decision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obj_id: currentHistoryId, user_id: currentHistoryId, historyId: currentHistoryId,
          userPrompt: scenarioPrompt || 'Scenario Decision',
          chosenPathNodes: selectedPathInfo.nodeIds.map(id => nodeMap[id]).filter(Boolean),
          acceptedAiRecommendation: selectedPathInfo.acceptedAi,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg('Decision Path Saved!');
        setSavedPathKey(selectedPathInfo.nodeIds.join('->'));
        if (data.analysis?.profile) setCharacterProfile(data.analysis.profile);
        setTimeout(() => { setSaveSuccessMsg(''); setSelectedPathInfo(null); }, 1500);
      } else {
        alert(data.error || 'Failed to save decision path.');
      }
    } catch { alert('An error occurred while saving decision path.'); }
    finally { setSavingPath(false); }
  }, [selectedPathInfo, nodes, scenarioPrompt, currentHistoryId]);

  /* ─── Export / Share ─── */
  const handleExport = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ nodes, edges, recommendation }, null, 2));
    a.download = 'path0_map.json';
    document.body.appendChild(a); a.click(); a.remove();
  };
  const handleShare = () => {
    if (typeof window !== 'undefined') { navigator.clipboard.writeText(window.location.href); alert('Map link copied to clipboard!'); }
  };

  /* ══════════════════════════════════════════════ */
  if (loading || status === 'loading' || status === 'unauthenticated') {
    return <HiLoader isUnauth={status === 'unauthenticated'} />;
  }

  /* ══════════════════════════════════════════════ */
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#09090b', overflow: 'hidden' }}>

      {/* Dot Grid Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <DotGrid dotSize={3} gap={15} baseColor="#2F293A" activeColor="#ff0000ff"
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
        nodeTypes={nodeTypes} fitView colorMode="dark"
        style={{ background: 'transparent' }}
      >
        <Background color="rgba(113,113,122,0.4)" bgColor="transparent" variant="dots" gap={28} size={1.2} />

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
          />
        </Panel>

        <Controls position="bottom-right" style={{ marginBottom: '20px', marginRight: '20px' }} />
        <MiniMap
          position="top-right"
          style={{ marginTop: '82px', marginRight: '20px' }}
          nodeColor={n => n.data?.isHighlighted ? '#ffd700' : '#8b5cf6'}
        />
      </ReactFlow>
    </div>
  );
}

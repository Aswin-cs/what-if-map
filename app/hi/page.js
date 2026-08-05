"use client"
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Sparkles, RotateCcw, BrainCircuit, Compass, Target, ArrowRight, Zap, ChevronUp, ChevronDown, Check, Save } from 'lucide-react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
  Controls,
  Background,
  Panel,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from '../components/customNode';
import { useUserContext } from '../hooks/userContext';
import DotGrid from '../components/DotGrid';

const nodeTypes = { custom: CustomNode };

export default function App() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { nodes: contextNodes, edges: contextEdges, flowData: contextAdvice, currentHistoryId, setCurrentHistoryId, setNodes: setContextNodes, setEdges: setContextEdges } = useUserContext();
  const [nodes, setNodes] = useState(contextNodes || []);
  const [edges, setEdges] = useState(contextEdges || []);
  const [recommendation, setRecommendation] = useState(contextAdvice || null);
  const [loading, setLoading] = useState(true);
  const [scenarioPrompt, setScenarioPrompt] = useState("");
  const [isAdviceOpen, setIsAdviceOpen] = useState(true);
  const [selectedPathInfo, setSelectedPathInfo] = useState(null);
  const [savingPath, setSavingPath] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [savedPathKeyForCurrentScenario, setSavedPathKeyForCurrentScenario] = useState(null);
  const [characterProfile, setCharacterProfile] = useState(null);

  // Fetch existing character profile on authenticated load (no re-analysis)
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchCharacterProfile() {
      try {
        const res = await fetch("/api/ai/analysis");
        const resData = await res.json();
        if (resData.success && resData.profile) {
          setCharacterProfile(resData.profile);
        }
      } catch (err) {
        console.error("Failed to fetch character profile:", err);
      }
    }

    fetchCharacterProfile();
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    async function fetchLatestHistory() {
      try {
        setLoading(true);
        // If context already has nodes from recent submission, use them first
        if (contextNodes && contextNodes.length > 0) {
          setNodes(contextNodes);
          if (contextEdges) setEdges(contextEdges);
          if (contextAdvice) setRecommendation(contextAdvice);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/history/latest");
        const resData = await res.json();

        if (resData.success && resData.data) {
          const fetchedNodes = resData.data.output_1_paths || [];
          const fetchedEdges = resData.data.output_2_flow_edges || [];
          const fetchedAdvice = resData.data.output_3_recommendation_and_advice || null;

          setNodes(fetchedNodes);
          setEdges(fetchedEdges);
          setRecommendation(fetchedAdvice);
          setScenarioPrompt(resData.userPrompt || "");
          if (setCurrentHistoryId && (resData._id || resData.historyId)) {
            setCurrentHistoryId(resData._id || resData.historyId);
          }

          if (setContextNodes) setContextNodes(fetchedNodes);
          if (setContextEdges) setContextEdges(fetchedEdges);
        }
      } catch (err) {
        console.error("Failed to fetch latest scenario history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLatestHistory();
  }, [status, router, contextNodes, contextEdges, contextAdvice, setCurrentHistoryId, setContextNodes, setContextEdges]);

  // Fetch past saved decision specifically for this scenario (by obj_id / currentHistoryId)
  useEffect(() => {
    async function fetchSavedDecisionForCurrentScenario() {
      if (status !== "authenticated" || !currentHistoryId) {
        setSavedPathKeyForCurrentScenario(null);
        return;
      }

      try {
        const res = await fetch(`/api/history/save-decision?obj_id=${currentHistoryId}`);
        const resData = await res.json();

        if (resData.success && resData.savedDecision && resData.savedDecision.chosenPath) {
          const pathKey = resData.savedDecision.chosenPath
            .map((step) => step.pathId)
            .filter(Boolean)
            .join("->");
          setSavedPathKeyForCurrentScenario(pathKey || null);
        } else {
          setSavedPathKeyForCurrentScenario(null);
        }
      } catch (err) {
        console.error("Failed to fetch saved decision for current scenario:", err);
        setSavedPathKeyForCurrentScenario(null);
      }
    }

    fetchSavedDecisionForCurrentScenario();
  }, [status, currentHistoryId]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, []);

  // Node Selection Handler: Highlight lineage path edges & nodes back to parent in Gold (only for end-of-path nodes)
  const handleNodeClick = useCallback((_, node) => {
    // Only allow selection for leaf/end-of-path nodes (nodes with no outgoing edges)
    const isLeafNode = !edges.some((edge) => edge.source === node.id);
    if (!isLeafNode) {
      return;
    }

    // Map target node ID -> edge connecting to it
    const targetToEdgeMap = {};
    edges.forEach((edge) => {
      targetToEdgeMap[edge.target] = edge;
    });

    // Trace path from selected end/path node up to root
    const pathEdgeIds = new Set();
    const orderedNodeIds = [];
    let currentId = node.id;
    orderedNodeIds.unshift(currentId);

    while (currentId && targetToEdgeMap[currentId]) {
      const edge = targetToEdgeMap[currentId];
      pathEdgeIds.add(edge.id);
      currentId = edge.source;
      if (currentId) {
        orderedNodeIds.unshift(currentId);
      }
    }

    const pathNodeSet = new Set(orderedNodeIds);

    // Highlight traced path nodes in Gold (#ffd700)
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isHighlighted: pathNodeSet.has(n.id),
        },
      }))
    );

    // Highlight traced path edges in Gold (#ffd700)
    setEdges((eds) =>
      eds.map((edge) => {
        if (pathEdgeIds.has(edge.id)) {
          return {
            ...edge,
            animated: true,
            style: {
              ...edge.style,
              stroke: '#ffd700', // Gold stroke
              strokeWidth: 3.5,
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))',
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#ffd700',
            },
          };
        }
        return {
          ...edge,
          animated: false,
          style: {
            ...edge.style,
            stroke: '#52525b',
            strokeWidth: 2,
            filter: 'none',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#71717a',
          },
        };
      })
    );

    const isAi = recommendation?.recommended_lineage &&
      JSON.stringify(orderedNodeIds) === JSON.stringify(recommendation.recommended_lineage);

    const pathKey = orderedNodeIds.join("->");
    if (savedPathKeyForCurrentScenario !== pathKey) {
      setSelectedPathInfo({
        nodeIds: orderedNodeIds,
        acceptedAi: Boolean(isAi),
      });
    } else {
      setSelectedPathInfo(null);
    }
    setSaveSuccessMsg("");
  }, [edges, recommendation, savedPathKeyForCurrentScenario]);

  // Canvas Click Handler: Reset node & edge highlighting
  const handlePaneClick = useCallback(() => {
    setSelectedPathInfo(null);
    setSaveSuccessMsg("");

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isHighlighted: false,
        },
      }))
    );

    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: false,
        style: {
          ...edge.style,
          stroke: '#52525b',
          strokeWidth: 2,
          filter: 'none',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#71717a',
        },
      }))
    );
  }, []);

  // Accept AI Recommendation: Highlight the AI recommended lineage in Gold
  const handleAcceptRecommendation = useCallback(() => {
    if (!recommendation || !recommendation.recommended_lineage || recommendation.recommended_lineage.length === 0) {
      return;
    }

    const lineage = recommendation.recommended_lineage;
    const lineageNodeSet = new Set(lineage);

    const lineageEdgePairs = new Set();
    for (let i = 0; i < lineage.length - 1; i++) {
      lineageEdgePairs.add(`${lineage[i]}->${lineage[i + 1]}`);
    }

    // Highlight recommended lineage nodes in MiniMap
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isHighlighted: lineageNodeSet.has(n.id),
        },
      }))
    );

    // Highlight recommended lineage edges in Gold (#ffd700)
    setEdges((eds) =>
      eds.map((edge) => {
        const pairKey = `${edge.source}->${edge.target}`;
        if (lineageEdgePairs.has(pairKey)) {
          return {
            ...edge,
            animated: true,
            style: {
              ...edge.style,
              stroke: '#ffd700', // Gold stroke
              strokeWidth: 3.5,
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))',
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#ffd700',
            },
          };
        }
        return {
          ...edge,
          animated: false,
          style: {
            ...edge.style,
            stroke: '#52525b',
            strokeWidth: 2,
            filter: 'none',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#71717a',
          },
        };
      })
    );

    const pathKey = lineage.join("->");
    if (savedPathKeyForCurrentScenario !== pathKey) {
      setSelectedPathInfo({
        nodeIds: lineage,
        acceptedAi: true,
      });
    } else {
      setSelectedPathInfo(null);
    }
    setSaveSuccessMsg("");
  }, [recommendation, savedPathKeyForCurrentScenario]);

  // Save Decision Path to MongoDB API
  const handleSaveDecision = useCallback(async () => {
    if (!selectedPathInfo || !selectedPathInfo.nodeIds || selectedPathInfo.nodeIds.length === 0) return;

    setSavingPath(true);
    setSaveSuccessMsg("");

    try {
      const nodeMap = {};
      nodes.forEach((n) => {
        nodeMap[n.id] = n;
      });

      const chosenPathNodes = selectedPathInfo.nodeIds
        .map((id) => nodeMap[id])
        .filter(Boolean);

      const res = await fetch("/api/history/save-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          obj_id: currentHistoryId,
          user_id: currentHistoryId,
          historyId: currentHistoryId,
          userPrompt: scenarioPrompt || "Scenario Decision",
          chosenPathNodes: chosenPathNodes,
          acceptedAiRecommendation: selectedPathInfo.acceptedAi,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSaveSuccessMsg("Decision Path Saved!");
        const currentPathKey = selectedPathInfo.nodeIds.join("->");
        setSavedPathKeyForCurrentScenario(currentPathKey);

        // Update character profile if analysis returned a new profile
        if (resData.analysis && resData.analysis.profile) {
          setCharacterProfile(resData.analysis.profile);
        }

        setTimeout(() => {
          setSaveSuccessMsg("");
          setSelectedPathInfo(null);
        }, 1500);
      } else {
        alert(resData.error || "Failed to save decision path.");
      }
    } catch (err) {
      console.error("Save decision error:", err);
      alert("An error occurred while saving decision path.");
    } finally {
      setSavingPath(false);
    }
  }, [selectedPathInfo, nodes, scenarioPrompt, currentHistoryId]);

  const handleAddNode = (category) => {
    const id = `n_${Date.now()}`;
    const labels = {
      mindset: 'Cognitive Vector',
      trigger: 'Catalyst Factor',
      choice: 'Strategic Path',
      prediction: 'Projected Model',
      outcome: 'Realized Objective'
    };

    const newNode = {
      id,
      type: 'custom',
      position: {
        x: Math.random() * 400 + 300,
        y: Math.random() * 300 + 150
      },
      data: {
        category,
        label: labels[category] || 'Custom Vector',
        msg: 'User defined parameters',
        probability: 80,
      }
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const handleResetFlow = () => {
    if (contextNodes && contextNodes.length > 0) {
      setNodes(contextNodes);
      setEdges(contextEdges);
    }
  };

  // Modern Loader Screen
  if (loading || status === "loading" || status === "unauthenticated") {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <DotGrid
            dotSize={5}
            gap={15}
            baseColor="#2F293A"
            activeColor="#5227FF"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>
        <div style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          marginBottom: '24px'
        }}>
          <div style={{
            boxSizing: 'border-box',
            display: 'block',
            position: 'absolute',
            width: '64px',
            height: '64px',
            border: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            borderColor: '#3b82f6 transparent transparent transparent'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Loading Scenario Map...
        </h2>
        <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>
          Fetching latest AI scenario paths & edges from database
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#09090b', overflow: 'hidden' }}>
      {/* Interactive Dot Grid Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <DotGrid
            dotSize={5}
    gap={15}
    baseColor="#2F293A"
    activeColor="#5227FF"
    proximity={120}
    shockRadius={250}
    shockStrength={5}
    resistance={750}
    returnDuration={1.5}
        />
      </div>

      {/* ═══ Premium Floating Navbar with Animated Gradient Border ═══ */}
      <nav
        className="app-header"
        style={{
          position: 'absolute',
          top: '14px',
          left: '24px',
          right: '24px',
          zIndex: 50,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '18px',
          border: 'none',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* ── Left: Navigation & Brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Home Button */}
          <Link href="/" className="nav-btn">
            <ArrowLeft size={14} />
            <span>Home</span>
          </Link>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '24px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)'
          }} />

          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="nav-logo-icon"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1) rotate(8deg)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
            >
              <Sparkles size={17} color="#fff" strokeWidth={2.5} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  margin: 0,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  What-If Map
                </h1>
                <span style={{
                  fontSize: '8px',
                  fontWeight: '800',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#818cf8',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  padding: '2px 7px',
                  borderRadius: '6px',
                }}>
                  PRO
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                color: '#64748b',
                fontWeight: '500',
                letterSpacing: '0.02em',
              }}>
                AI Decision Studio
              </span>
            </div>
          </div>
        </div>

        {/* ── Center: Active Scenario Pill ── */}
        {scenarioPrompt && (
          <div className="nav-pill" style={{ maxWidth: '360px' }}>
            <div className="live-dot" />
            <Compass size={13} color="#818cf8" />
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '280px'
            }}>
              {scenarioPrompt}
            </span>
          </div>
        )}

        {/* ── Right: Persona Badge & Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Character Profile Badge */}
          {characterProfile && (
            <div
              className="nav-pill"
              title={characterProfile.traitsSummary}
              style={{
                cursor: 'help',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                borderColor: 'rgba(168, 85, 247, 0.25)',
              }}
            >
              <BrainCircuit size={14} color="#c084fc" />
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#d8b4fe',
              }}>
                {characterProfile.riskTolerance} • {characterProfile.decisionStyle}
              </span>
            </div>
          )}

          {/* Reset Layout — Primary CTA */}
          <button
            onClick={handleResetFlow}
            className="nav-btn nav-btn-primary"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </nav>

      {/* Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        style={{ background: 'transparent' }}
      >
        <Background color="rgba(113, 113, 122, 0.4)" bgColor="transparent" variant="dots" gap={28} size={1.2} />

        {/* AI Recommendation & Strategic Advice Box */}
        {recommendation && (
          <Panel position="top-left" style={{ marginTop: '82px', marginLeft: '16px', maxWidth: '390px' }}>
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(16, 24, 28, 0.88) 0%, rgba(10, 16, 20, 0.96) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '18px',
              padding: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(34, 197, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(28px) saturate(210%)',
              WebkitBackdropFilter: 'blur(28px) saturate(210%)',
              color: '#f4f4f5',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              {/* Top Emerald Accent Line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #60a5fa 100%)',
                boxShadow: '0 0 12px #10b981'
              }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isAdviceOpen ? '12px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(34, 197, 94, 0.25)'
                  }}>
                    <Sparkles size={16} color="#34d399" />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      margin: 0,
                      background: 'linear-gradient(135deg, #ffffff 0%, #a7f3d0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.01em'
                    }}>
                      AI Strategic Advice
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsAdviceOpen(!isAdviceOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <span>{isAdviceOpen ? 'Hide' : 'View'}</span>
                  {isAdviceOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {isAdviceOpen && (
                <>
                  {/* Target Path Badge */}
                  {recommendation.recommended_path_id && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                        color: '#34d399',
                        border: '1px solid rgba(34, 197, 94, 0.35)',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        boxShadow: '0 0 10px rgba(34, 197, 94, 0.15)'
                      }}>
                        <Target size={12} color="#34d399" />
                        <span>Target Path: {recommendation.recommended_path_id}</span>
                      </div>
                    </div>
                  )}

                  {/* Advice Text Block */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderLeft: '3px solid #10b981',
                    borderRadius: '0 10px 10px 0',
                    padding: '10px 12px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0, lineHeight: '1.55', fontWeight: '400' }}>
                      {recommendation.strategic_advice}
                    </p>
                  </div>

                  {/* Best Lineage Visualizer */}
                  {recommendation.recommended_lineage && recommendation.recommended_lineage.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Recommended Lineage
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {recommendation.recommended_lineage.map((nodeId, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '11px',
                              background: 'rgba(34, 197, 94, 0.12)',
                              color: '#6ee7b7',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: '700',
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                            }}>
                              {nodeId}
                            </span>
                            {idx < recommendation.recommended_lineage.length - 1 && (
                              <ArrowRight size={12} color="#34d399" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accept Recommendation CTA Button */}
                  <button
                    onClick={handleAcceptRecommendation}
                    className="nav-btn"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
                      color: '#09090b',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 20px -4px rgba(234, 179, 8, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      letterSpacing: '0.01em'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(234, 179, 8, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(234, 179, 8, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }}
                  >
                    <Zap size={15} fill="#09090b" color="#09090b" />
                    <span>Accept Recommendation</span>
                  </button>
                </>
              )}
            </div>
          </Panel>
        )}

        {/* Floating Save Decision Path Bar */}
        {selectedPathInfo && selectedPathInfo.nodeIds && selectedPathInfo.nodeIds.length > 0 && (
          <Panel position="bottom-center" style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.92) 0%, rgba(12, 12, 18, 0.96) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              padding: '12px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              color: '#f4f4f5',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={14} color="#ffd700" />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffd700', letterSpacing: '-0.01em' }}>
                      Selected Path ({selectedPathInfo.nodeIds.length} steps)
                    </span>
                  </div>
                  {selectedPathInfo.acceptedAi ? (
                    <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.2)', color: '#34d399', border: '1px solid rgba(34, 197, 94, 0.35)', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>
                      AI Recommended
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>
                      Custom Choice
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                  {selectedPathInfo.nodeIds.map((id) => {
                    const found = nodes.find((n) => n.id === id);
                    return found?.data?.label || found?.label || id;
                  }).join(' → ')}
                </div>
              </div>

              <button
                onClick={handleSaveDecision}
                disabled={savingPath}
                className="nav-btn"
                style={{
                  background: saveSuccessMsg ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: savingPath ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: saveSuccessMsg ? '0 6px 20px rgba(16, 185, 129, 0.4)' : '0 6px 20px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (!savingPath) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                {saveSuccessMsg ? <Check size={15} /> : <Save size={15} />}
                <span>{savingPath ? 'Saving...' : saveSuccessMsg ? 'Decision Saved!' : 'Save Chosen Path'}</span>
              </button>
            </div>
          </Panel>
        )}

        <Controls position="bottom-right" style={{ marginBottom: '20px', marginRight: '20px' }} />
        <MiniMap position="top-right" style={{ marginTop: '82px', marginRight: '20px' }} nodeColor={(n) => {
          if (n.data?.isHighlighted) return '#ffd700'; // Highlight chosen lineage nodes in Gold
          if (n.data?.category === 'mindset') return '#8b5cf6';
          if (n.data?.category === 'trigger') return '#3b82f6';
          if (n.data?.category === 'prediction') return '#f59e0b';
          if (n.data?.category === 'choice') return '#f43f5e';
          if (n.data?.category === 'outcome') return '#10b981';
          return '#71717a';
        }} />
      </ReactFlow>
    </div>
  );
}

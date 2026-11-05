"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Pencil, Sparkles, X, Loader2, Target, ArrowRight, Bookmark,
  Check, RotateCcw, Maximize2, Minimize2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '../hooks/userContext';
import { AI_PROCESSING_WORDS } from '@/lib/aiProcessingWords';
import './GlassPromptEditor.css';

export default function GlassPromptEditor({
  currentPrompt,
  historyId,
  onPromptUpdated,
  selectedPathInfo,
  nodes = [],
  edges = [],
  onSaveDecision,
  savingPath = false,
  saveSuccessMsg = '',
  onUndoDecision,
  undoingPath = false,
  undoSuccessMsg = '',
  onContinueStory,
  continuingStory = false,
  continueSuccessMsg = '',
  onSubmittingChange,
}) {
  const router = useRouter();
  const { setNodes, setEdges, setFlowData, setUserPrompt, setCurrentHistoryId } = useUserContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpandedView, setIsExpandedView] = useState(false);
  const [promptText, setPromptText] = useState(currentPrompt || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingWordIndex, setLoadingWordIndex] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isSubmitting) return;

    const interval = setInterval(() => {
      setLoadingWordIndex((prev) => (prev + 1) % AI_PROCESSING_WORDS.length);
    }, 1700);

    return () => {
      clearInterval(interval);
      setLoadingWordIndex(0);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Extract node objects for selected path
  const selectedPathNodes = useMemo(() => {
    return selectedPathInfo?.nodeIds
      ? selectedPathInfo.nodeIds
        .map((id) => nodes.find((n) => n.id === id) || { id, data: { label: id } })
      : [];
  }, [selectedPathInfo, nodes]);

  /* ─── Draggable Slider Logic for Step Pipeline ─── */
  const pipelineRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const handleMouseDown = useCallback((e) => {
    const el = pipelineRef.current;
    if (!el) return;
    setIsMouseDown(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftStart(el.scrollLeft);
  }, []);

  const handleMouseLeaveOrUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const el = pipelineRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.6;
    el.scrollLeft = scrollLeftStart - walk;
  }, [isMouseDown, startX, scrollLeftStart]);

  const handleRegenerate = async (customPrompt = null) => {
    const textToSubmit = (typeof customPrompt === 'string' ? customPrompt : promptText).trim();
    if (!textToSubmit || isSubmitting) return;

    setIsSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);

    const hasSelectedPath = !!(selectedPathInfo && selectedPathNodes && selectedPathNodes.length > 0);
    try {
      const res = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: historyId,
          userPrompt: textToSubmit,
          oldUserPrompt: currentPrompt || '',
          nodes: nodes || [],
          edges: edges || [],
          selectedPathNodes: selectedPathNodes || [],
          hasSelectedPath: hasSelectedPath,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUserPrompt(textToSubmit);
        if (setNodes) setNodes(data.data.output_1_paths || []);
        if (setEdges) setEdges(data.data.output_2_flow_edges || []);
        if (setFlowData) setFlowData(data.data.output_3_recommendation_and_advice || null);
        if (setCurrentHistoryId && data._id) setCurrentHistoryId(data._id);
        if (onPromptUpdated) onPromptUpdated(textToSubmit, data.data);
        setIsEditing(false);
        if (data._id && data._id !== historyId) {
          router.push(`/hi/${data._id}`);
        }
      } else {
        alert(data.error || 'Failed to edit scenario.');
      }
    } catch (err) {
      console.error('Error editing scenario:', err);
      alert('An error occurred while updating the scenario.');
    } finally {
      setIsSubmitting(false);
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  const handlePresetClick = (modifierText) => {
    const newText = promptText ? `${promptText.trim()} ${modifierText}` : modifierText;
    setPromptText(newText);
  };

  return (
    <>
      <div className={`glass-prompt-wrapper ${isMinimized ? 'minimized' : ''}`}>
        <div className="glass-prompt-card-container">
          <div className="glass-prompt-ambient-glow" />

          <div className={`glass-prompt-card ${isEditing ? 'editing' : ''} ${selectedPathNodes.length > 0 ? 'has-path' : ''}`}>
          {!isEditing ? (
            /* ─── View Mode ─── */
            <div className="glass-anim-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Top Row: Icon Badge, Scenario Prompt Title & Edit Button */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
              }}>
                {/* Left: Soft Square Badge & Scenario Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <div className="glass-header-icon">
                    <Sparkles size={20} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span className="glass-badge-label">
                      Scenario Prompt
                    </span>
                    <h2 className="glass-prompt-title">
                      {currentPrompt || 'Untitled Scenario'}
                    </h2>
                  </div>
                </div>

                {/* Right: Edit & Close Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      setPromptText(currentPrompt || '');
                      setIsEditing(true);
                    }}
                    className="glass-btn-edit"
                    title="Modify scenario prompt"
                  >
                    <Pencil size={15} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="glass-btn-close"
                    title="Close / Minimize prompt"
                    aria-label="Close scenario prompt"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* ─── Chosen Path Sub-Card Section ─── */}
              {selectedPathNodes.length > 0 && (
                <div className="glass-chosen-path-box">
                  <div className="glass-chosen-path-header">
                    <span className="glass-chosen-path-tag">CHOSEN PATH</span>
                    <span className="glass-chosen-path-count">
                      {selectedPathNodes.length} {selectedPathNodes.length === 1 ? 'step' : 'steps'} so far
                    </span>
                  </div>

                  {isExpandedView ? (
                    /* Detailed Vertical Breakdown View */
                    <div className="glass-expanded-timeline-container">
                      {selectedPathNodes.map((n, idx) => {
                        const isFinal = idx === selectedPathNodes.length - 1;
                        const label = n.data?.label || n.data?.title || n.id;
                        const description = n.data?.msg || n.data?.description || n.data?.details || '';
                        return (
                          <div key={n.id || idx} className={`glass-expanded-step-item ${isFinal ? 'is-final' : ''}`}>
                            <div className="glass-expanded-step-left">
                              <span className="glass-expanded-step-badge">
                                Step {String(idx + 1).padStart(2, '0')}
                              </span>
                              {idx < selectedPathNodes.length - 1 && (
                                <div className="glass-expanded-line" />
                              )}
                            </div>

                            <div className="glass-expanded-step-content">
                              <div className="glass-expanded-step-header">
                                <span className="glass-expanded-step-title">{label}</span>
                                {isFinal && (
                                   <span className="glass-expanded-final-pill">
                                    <Target size={11} /> Final Destination
                                  </span>
                                )}
                              </div>
                              {description ? (
                                <p className="glass-expanded-step-desc">{description}</p>
                              ) : (
                                <p className="glass-expanded-step-desc muted">Decision node along this scenario subpath.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Horizontal Stepper Timeline */
                    <div
                      ref={pipelineRef}
                      className="glass-stepper-track"
                      onMouseDown={handleMouseDown}
                      onMouseLeave={handleMouseLeaveOrUp}
                      onMouseUp={handleMouseLeaveOrUp}
                      onMouseMove={handleMouseMove}
                    >
                      {selectedPathNodes.map((n, idx) => {
                        const isCurrent = idx === selectedPathNodes.length - 1;
                        const isCompleted = idx < selectedPathNodes.length - 1;
                        const label = n.data?.label || n.data?.title || n.id;
                        return (
                          <div key={n.id || idx} className="glass-stepper-step">
                            <div className="glass-stepper-node-row">
                              <div className={`glass-stepper-circle ${isCurrent ? 'is-current' : 'is-completed'}`}>
                                {isCompleted ? (
                                  <Check size={14} strokeWidth={2.8} />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>
                              {idx < selectedPathNodes.length - 1 ? (
                                <div className="glass-stepper-line solid" />
                              ) : (
                                <div className="glass-stepper-line dashed" />
                              )}
                            </div>
                            <div className="glass-stepper-info">
                              <span className={`glass-stepper-step-label ${isCurrent ? 'is-current' : ''}`}>
                                {isCurrent ? 'Current step' : `Step ${idx + 1}`}
                              </span>
                              <span className="glass-stepper-step-title">{label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─── Bottom Action Row ─── */}
              {selectedPathNodes.length > 0 && (
                <div className="glass-action-bar">
                  <div className="glass-action-left">
                    <button
                      type="button"
                      onClick={() => setIsExpandedView(v => !v)}
                      className="glass-action-btn-outline"
                      title={isExpandedView ? 'Switch to Compact Stepper' : 'Expand Path Detail View'}
                    >
                      {isExpandedView ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                      <span>{isExpandedView ? 'Compact view' : 'Expanded view'}</span>
                    </button>

                    {selectedPathInfo?.isSaved ? (
                      onUndoDecision && (
                        <button
                          onClick={onUndoDecision}
                          disabled={undoingPath || !!undoSuccessMsg}
                          className="glass-action-btn-outline"
                        >
                          {undoSuccessMsg ? <Check size={15} /> : <RotateCcw size={15} />}
                          <span>{undoingPath ? 'Undoing...' : undoSuccessMsg ? 'Unsaved!' : 'Undo save'}</span>
                        </button>
                      )
                    ) : (
                      onSaveDecision && (
                        <button
                          onClick={onSaveDecision}
                          disabled={savingPath || !!saveSuccessMsg}
                          className="glass-action-btn-outline"
                        >
                          {saveSuccessMsg ? <Check size={15} /> : <Bookmark size={15} />}
                          <span>{savingPath ? 'Saving...' : saveSuccessMsg ? 'Path Saved!' : 'Save path'}</span>
                        </button>
                      )
                    )}
                  </div>

                  {onContinueStory && (
                    <button
                      onClick={onContinueStory}
                      disabled={continuingStory || !!continueSuccessMsg}
                      className="glass-action-btn-primary spp-btn-continue"
                    >
                      {continuingStory ? (
                        <>
                          <Loader2 size={16} className="spin" />
                          <span>Continuing...</span>
                        </>
                      ) : continueSuccessMsg ? (
                        <>
                          <Check size={16} />
                          <span>Continued!</span>
                        </>
                      ) : (
                        <>
                          <span>Continue story</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ─── Edit Mode ─── */
            <div className="glass-anim-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="glass-badge-label" style={{ fontSize: '11px' }}>
                  Edit & Re-Explore Scenario
                </span>
                <button
                  onClick={() => { setIsEditing(false); setPromptText(currentPrompt); }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  <X size={15} />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe your what-if scenario..."
                rows={3}
                className="glass-textarea"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleRegenerate();
                  }
                }}
              />

              {/* Quick Suggestion Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginRight: '4px' }}>
                  Quick Add:
                </span>
                <button
                  type="button"
                  onClick={() => handlePresetClick('with unexpected plot twist')}
                  className="glass-preset-chip"
                >
                  Plot Twist
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('focusing on high growth and scaling')}
                  className="glass-preset-chip"
                >
                  High Growth
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('5 years down the road')}
                  className="glass-preset-chip"
                >
                  5 Years Later
                </button>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Press <kbd style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)', color: 'var(--text-primary)', fontWeight: '600' }}>Ctrl + Enter</kbd> to submit
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => { setIsEditing(false); setPromptText(currentPrompt); }}
                    disabled={isSubmitting}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRegenerate()}
                    disabled={!promptText.trim() || isSubmitting}
                    className={`glass-btn-regen ${isSubmitting ? 'is-submitting' : ''}`}
                    style={{
                      opacity: (!promptText.trim() || isSubmitting) ? 0.5 : 1,
                      cursor: (!promptText.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        <span key={loadingWordIndex} className="ai-processing-text">
                          {AI_PROCESSING_WORDS[loadingWordIndex]}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Re-Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>

      {/* ─── Tiny Toggle Icon Button (with App Logo) ─── */}
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className={`glass-toggle-icon-btn ${isMinimized ? 'is-visible' : ''}`}
        title="Open Scenario Prompt"
        aria-label="Open Scenario Prompt"
      >
        <div className="glass-toggle-ambient-glow" />
        <Image
          src="/what-if-map-logo-animated.svg"
          alt="What-If Map Logo"
          width={32}
          height={32}
          className="glass-toggle-logo"
        />
        <span className="glass-toggle-tooltip">Scenario Prompt</span>
      </button>
    </>
  );
}

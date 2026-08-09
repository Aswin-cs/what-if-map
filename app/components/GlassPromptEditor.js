"use client";
import { useState, useRef, useEffect } from 'react';
import { Pencil, Sparkles, X, Loader2, Wand2, Target, ArrowRight, Save, Check, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '../hooks/userContext';

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
  const [promptText, setPromptText] = useState(currentPrompt || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setPromptText(currentPrompt || '');
  }, [currentPrompt]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Extract node objects for selected path
  const selectedPathNodes = selectedPathInfo?.nodeIds
    ? selectedPathInfo.nodeIds
        .map((id) => nodes.find((n) => n.id === id) || { id, data: { label: id } })
    : [];

  const handleRegenerate = async () => {
    if (!promptText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);

    const hasSelectedPath = !!(selectedPathInfo && selectedPathNodes && selectedPathNodes.length > 0);
    try {
      const res = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: historyId,
          userPrompt: promptText.trim(),
          nodes: nodes || [],
          edges: edges || [],
          selectedPathNodes: selectedPathNodes || [],
          hasSelectedPath: hasSelectedPath,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUserPrompt(promptText.trim());
        if (setNodes) setNodes(data.data.output_1_paths || []);
        if (setEdges) setEdges(data.data.output_2_flow_edges || []);
        if (setFlowData) setFlowData(data.data.output_3_recommendation_and_advice || null);
        if (setCurrentHistoryId && data._id) setCurrentHistoryId(data._id);
        if (onPromptUpdated) onPromptUpdated(promptText.trim(), data.data);
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

  return (
    <>
      <style>{`
        @keyframes glass-prompt-popup {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(40px) scale(0.92);
            filter: blur(10px);
          }
          60% {
            opacity: 0.95;
            transform: translateX(-50%) translateY(-4px) scale(1.01);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes glass-fade-in {
          0% {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .glass-prompt-wrapper {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 40;
          width: 90%;
          max-width: 680px;
          pointer-events: auto;
          animation: glass-prompt-popup 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .glass-prompt-card {
          background: var(--panel-bg);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid var(--panel-border);
          border-radius: 20px;
          padding: 14px 20px;
          box-shadow: var(--panel-shadow);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .glass-prompt-card.editing {
          padding: 20px;
          border-color: rgba(139, 92, 246, 0.45);
          box-shadow: 0 24px 60px rgba(139, 92, 246, 0.2), 0 0 35px rgba(139, 92, 246, 0.25);
        }

        .glass-prompt-card.has-path {
          border-color: rgba(255, 215, 0, 0.4);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.15), 0 0 30px rgba(255, 215, 0, 0.15);
        }

        .glass-anim-content {
          animation: glass-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .glass-textarea {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 12px;
          padding: 14px 16px;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.55;
          outline: none;
          resize: none;
          font-family: inherit;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.1);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .glass-textarea:focus {
          border-color: rgba(139, 92, 246, 0.7);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }

        .glass-btn-edit {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.12);
          border: 1px solid rgba(139, 92, 246, 0.25);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .glass-btn-edit:hover {
          background: rgba(139, 92, 246, 0.22);
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
        }

        .glass-btn-regen {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border: none;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
          transition: all 0.25s ease;
        }

        .glass-btn-regen:hover:not(:disabled) {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
        }

        /* ─── Selected Path Section ─── */
        .glass-path-container {
          padding-top: 10px;
          margin-top: 8px;
          border-top: 1px solid var(--panel-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: glass-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-path-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .glass-path-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #d97706;
        }
        [data-theme="dark"] .glass-path-badge { color: #ffd700; }

        .glass-save-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #059669;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        [data-theme="dark"] .glass-save-btn { color: #34d399; }

        .glass-save-btn:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.25);
          border-color: rgba(16, 185, 129, 0.5);
          color: #047857;
        }
        [data-theme="dark"] .glass-save-btn:hover:not(:disabled) { color: #6ee7b7; }

        .glass-undo-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        [data-theme="dark"] .glass-undo-btn { color: #f87171; }

        .glass-undo-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
          color: #b91c1c;
        }
        [data-theme="dark"] .glass-undo-btn:hover:not(:disabled) { color: #fca5a5; }

        .glass-continue-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.2));
          border: 1px solid rgba(6, 182, 212, 0.4);
          color: #0284c7;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(6, 182, 212, 0.2);
        }
        [data-theme="dark"] .glass-continue-btn { color: #67e8f9; }

        .glass-continue-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.35), rgba(59, 130, 246, 0.3));
          border-color: rgba(6, 182, 212, 0.6);
          color: #0369a1;
          transform: translateY(-1px);
        }
        [data-theme="dark"] .glass-continue-btn:hover:not(:disabled) { color: #a5f3fc; }

        .glass-path-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .glass-chip-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .glass-chip {
          font-size: 12px;
          font-weight: 600;
          background: rgba(217, 119, 6, 0.12);
          color: #b45309;
          border: 1px solid rgba(217, 119, 6, 0.3);
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
        }
        [data-theme="dark"] .glass-chip {
          background: rgba(255, 215, 0, 0.08);
          color: #ffe566;
          border: 1px solid rgba(255, 215, 0, 0.25);
        }

        .glass-chip-arrow {
          color: #d97706;
          opacity: 0.8;
        }
        [data-theme="dark"] .glass-chip-arrow { color: #ffd700; opacity: 0.7; }
      `}</style>

      <div className="glass-prompt-wrapper">
        <div className={`glass-prompt-card ${isEditing ? 'editing' : ''} ${selectedPathNodes.length > 0 ? 'has-path' : ''}`}>
          {!isEditing ? (
            /* View Mode */
            <div className="glass-anim-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1 }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(6, 182, 212, 0.35))',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8b5cf6',
                    flexShrink: 0,
                    boxShadow: '0 0 12px rgba(139, 92, 246, 0.3)',
                  }}>
                    <Sparkles size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                      Scenario Prompt
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {currentPrompt || 'Untitled Scenario'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="glass-btn-edit"
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
              </div>

              {/* ─── Selected Chosen Path Display inside the box ─── */}
              {selectedPathNodes.length > 0 && (
                <div className="glass-path-container">
                  <div className="glass-path-header">
                    <div className="glass-path-badge">
                      <Target size={13} color="#ffd700" />
                      <span>{selectedPathInfo?.isSaved ? 'Saved Decision Path' : selectedPathInfo?.acceptedAi ? 'AI Recommended Path' : 'Chosen Path'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedPathInfo?.isSaved ? (
                        onUndoDecision && (
                          <button
                            onClick={onUndoDecision}
                            disabled={undoingPath || !!undoSuccessMsg}
                            className="glass-undo-btn"
                          >
                            {undoSuccessMsg ? <Check size={13} /> : <RotateCcw size={13} />}
                            <span>{undoingPath ? 'Undoing...' : undoSuccessMsg ? 'Unsaved!' : 'Undo Save'}</span>
                          </button>
                        )
                      ) : (
                        onSaveDecision && (
                          <button
                            onClick={onSaveDecision}
                            disabled={savingPath || !!saveSuccessMsg}
                            className="glass-save-btn"
                          >
                            {saveSuccessMsg ? <Check size={13} /> : <Save size={13} />}
                            <span>{savingPath ? 'Saving...' : saveSuccessMsg ? 'Path Saved!' : 'Save Path'}</span>
                          </button>
                        )
                      )}

                      {onContinueStory && (
                        <button
                          onClick={onContinueStory}
                          disabled={continuingStory || !!continueSuccessMsg}
                          className="glass-continue-btn"
                        >
                          {continuingStory ? (
                            <Loader2 size={13} className="spin" />
                          ) : continueSuccessMsg ? (
                            <Check size={13} />
                          ) : (
                            <Sparkles size={13} />
                          )}
                          <span>{continuingStory ? 'Continuing...' : continueSuccessMsg ? 'Continued!' : 'Continue Story'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="glass-path-chips">
                    {selectedPathNodes.map((n, idx) => (
                      <div key={n.id || idx} className="glass-chip-item">
                        <span className="glass-chip">
                          {n.data?.label || n.id}
                        </span>
                        {idx < selectedPathNodes.length - 1 && (
                          <ArrowRight size={12} className="glass-chip-arrow" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Edit Mode */
            <div className="glass-anim-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: 'var(--accent-purple)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wand2 size={13} color="var(--accent-purple)" /> Edit & Re-explore Scenario
                </span>
                <button
                  onClick={() => { setIsEditing(false); setPromptText(currentPrompt); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <X size={16} />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type your scenario prompt here..."
                rows={3}
                className="glass-textarea"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleRegenerate();
                  }
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Press <kbd style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}>Ctrl + Enter</kbd> to submit
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => { setIsEditing(false); setPromptText(currentPrompt); }}
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={!promptText.trim() || isSubmitting}
                    className="glass-btn-regen"
                    style={{
                      opacity: (!promptText.trim() || isSubmitting) ? 0.5 : 1,
                      cursor: (!promptText.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <span>Re-Generate</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

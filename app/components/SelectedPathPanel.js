"use client";
import { Target, ArrowRight, Check, Save, RotateCcw, Sparkles, Loader2 } from 'lucide-react';

export default function SelectedPathPanel({
  selectedPathInfo,
  savingPath,
  saveSuccessMsg,
  onSave,
  undoingPath,
  undoSuccessMsg,
  onUndo,
  onContinueStory,
  continuingStory,
  continueSuccessMsg,
  isEditingSubmitting = false,
}) {
  if (!selectedPathInfo) return null;

  const isSaved = selectedPathInfo.isSaved;

  return (
    <div style={{
      background: 'var(--panel-bg)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      border: isSaved ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--panel-border)',
      borderRadius: '20px',
      padding: '18px 20px',
      boxShadow: 'var(--panel-shadow)',
      color: 'var(--text-primary)',
      fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
      animation: 'path-reveal-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: isSaved ? 'rgba(234, 179, 8, 0.15)' : 'rgba(139, 92, 246, 0.15)',
          border: isSaved ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isSaved ? '0 0 12px rgba(234, 179, 8, 0.25)' : '0 0 12px rgba(139, 92, 246, 0.25)',
        }}>
          <Target size={15} color={isSaved ? '#d97706' : '#8b5cf6'} />
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isSaved ? 'Saved Decision Path' : selectedPathInfo.acceptedAi ? 'AI Path Selected' : 'Path Selected'}
          </h3>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Selected Branch
          </span>
        </div>
      </div>

      {/* Node path chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {selectedPathInfo.nodeIds.map((nodeId, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`spp-chip ${isSaved ? 'saved' : 'unsaved'}`}>
              {nodeId}
            </span>
            {idx < selectedPathInfo.nodeIds.length - 1 && (
              <ArrowRight size={12} color={isSaved ? '#d97706' : '#8b5cf6'} style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.6))' }} />
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons Group */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Save or Undo Button */}
        {isSaved ? (
          <button
            onClick={onUndo}
            disabled={undoingPath || !!undoSuccessMsg || isEditingSubmitting}
            className="spp-btn-undo"
            style={{
              opacity: (undoingPath || !!undoSuccessMsg || isEditingSubmitting) ? 0.55 : 1,
              cursor: (undoingPath || !!undoSuccessMsg || isEditingSubmitting) ? 'not-allowed' : 'pointer',
            }}
          >
            {undoSuccessMsg ? <Check size={15} color="#dc2626" /> : <RotateCcw size={15} color="#dc2626" />}
            <span>
              {undoingPath ? 'Undoing...' : undoSuccessMsg ? 'Decision Unsaved!' : 'Undo Save Decision'}
            </span>
          </button>
        ) : (
          <button
            onClick={onSave}
            disabled={savingPath || !!saveSuccessMsg || isEditingSubmitting}
            className="spp-btn-save"
            style={{
              opacity: (savingPath || !!saveSuccessMsg || isEditingSubmitting) ? 0.55 : 1,
              cursor: (savingPath || !!saveSuccessMsg || isEditingSubmitting) ? 'not-allowed' : 'pointer',
            }}
          >
            {saveSuccessMsg ? <Check size={15} color="#16a34a" /> : <Save size={15} color="var(--accent-purple)" />}
            <span>
              {savingPath ? 'Saving...' : saveSuccessMsg ? 'Decision Saved!' : 'Save Chosen Path'}
            </span>
          </button>
        )}

        {/* Continue Story / Path Button */}
        {onContinueStory && (
          <button
            onClick={onContinueStory}
            disabled={continuingStory || !!continueSuccessMsg || isEditingSubmitting}
            className="spp-btn-continue"
            style={{
              opacity: (continuingStory || !!continueSuccessMsg || isEditingSubmitting) ? 0.55 : 1,
              cursor: (continuingStory || !!continueSuccessMsg || isEditingSubmitting) ? 'not-allowed' : 'pointer',
            }}
          >
            {continuingStory || isEditingSubmitting ? (
              <Loader2 size={15} className="spin" color="#ffffff" />
            ) : continueSuccessMsg ? (
              <Check size={15} color="#ffffff" />
            ) : null}
            <span>
              {continuingStory
                ? 'Continuing Story...'
                : isEditingSubmitting
                ? 'Regenerating...'
                : continueSuccessMsg
                ? 'Story Continued!'
                : 'Continue Story / Path'}
            </span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes path-reveal-down {
          0% { opacity: 0; transform: translateY(-12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }

        .spp-chip.unsaved {
          font-size: 11px;
          font-weight: 700;
          background: rgba(139, 92, 246, 0.12);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 4px 11px;
          border-radius: 8px;
        }

        .spp-chip.saved {
          font-size: 11px;
          font-weight: 700;
          background: rgba(234, 179, 8, 0.15);
          color: #d97706;
          border: 1px solid rgba(234, 179, 8, 0.35);
          padding: 4px 11px;
          border-radius: 8px;
        }
        [data-theme="dark"] .spp-chip.saved { color: #fef08a; }

        .spp-btn-save {
          width: 100%;
          background: rgba(139, 92, 246, 0.12);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .spp-btn-save:hover:not(:disabled) {
          background: rgba(139, 92, 246, 0.22);
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-1px);
        }

        .spp-btn-undo {
          width: 100%;
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        [data-theme="dark"] .spp-btn-undo { color: #f87171; }

        .spp-btn-undo:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.45);
          transform: translateY(-1px);
        }

        .spp-btn-continue {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.35);
        }
        .spp-btn-continue:hover:not(:disabled) {
          background: linear-gradient(135deg, #6d28d9 0%, #4338ca 100%);
          box-shadow: 0 6px 24px rgba(124, 58, 237, 0.5);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

"use client";
import { useState } from 'react';
import { Sparkles, Target, ArrowRight, Zap, ChevronDown } from 'lucide-react';

export default function AIAdvicePanel({ recommendation, isOpen, onToggle, onAccept }) {
  const [isGlowing, setIsGlowing] = useState(false);

  if (!recommendation) return null;

  const handleHighlightClick = (e) => {
    setIsGlowing(true);
    if (onAccept) onAccept(e);
    setTimeout(() => {
      setIsGlowing(false);
    }, 2500);
  };

  return (
    <div style={{
      background: 'var(--panel-bg)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      border: '1px solid var(--panel-border)',
      borderRadius: '20px',
      padding: '18px 20px',
      boxShadow: 'var(--panel-shadow)',
      color: 'var(--text-primary)',
      fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: isOpen ? '16px' : '0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.2)',
          }}>
            <Sparkles size={15} color="#8b5cf6" />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              AI Strategic Advice
            </h3>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Recommendation Engine
            </span>
          </div>
        </div>

        <button onClick={onToggle} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          color: 'var(--accent-purple)', fontSize: '11px', fontWeight: '600',
          cursor: 'pointer', padding: '5px 12px', borderRadius: '9999px',
          transition: 'all 0.2s ease',
        }}>
          <span>{isOpen ? 'Hide' : 'View'}</span>
          <ChevronDown size={12} style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }} />
        </button>
      </div>

      {/* Expandable Body */}
      <div style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        opacity: isOpen ? 1 : 0,
        transition: 'grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingTop: isOpen ? '6px' : '0' }}>

            {/* Target Path Tag */}
            {recommendation.recommended_path_id && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '11px', fontWeight: '600',
                  background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-purple)',
                  border: '1px solid rgba(139, 92, 246, 0.28)', padding: '4px 12px', borderRadius: '9999px',
                }}>
                  <Target size={12} color="#8b5cf6" /> Target: {recommendation.recommended_path_id}
                </span>
              </div>
            )}

            {/* Strategic Advice Quote Box */}
            <div style={{
              position: 'relative',
              background: 'rgba(139, 92, 246, 0.04)',
              border: '1px solid var(--panel-border)',
              borderRadius: '14px',
              padding: '14px 16px 14px 18px',
              marginBottom: '16px',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '3px',
                background: '#8b5cf6',
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.8)',
              }} />
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.65', fontWeight: '400' }}>
                {recommendation.strategic_advice}
              </p>
            </div>

            {/* Recommended Lineage */}
            {recommendation.recommended_lineage?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                <span style={{
                  fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  Recommended Lineage
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {recommendation.recommended_lineage.map((nodeId, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '700',
                        background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-purple)',
                        border: '1px solid rgba(139, 92, 246, 0.3)', padding: '4px 11px', borderRadius: '8px',
                      }}>
                        {nodeId}
                      </span>
                      {idx < recommendation.recommended_lineage.length - 1 && (
                        <ArrowRight size={12} color="#8b5cf6" style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.6))' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlight Recommendation Button */}
            <button
              onClick={handleHighlightClick}
              className={`ai-advice-highlight-btn ${isGlowing ? 'active-glow' : ''}`}
            >
              <span>{isGlowing ? 'Recommendation Highlighted!' : 'Highlight Recommendation'}</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

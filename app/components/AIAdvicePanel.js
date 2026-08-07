"use client";
import { Sparkles, Target, ArrowRight, Zap, ChevronDown } from 'lucide-react';

export default function AIAdvicePanel({ recommendation, isOpen, onToggle, onAccept }) {
  if (!recommendation) return null;

  return (
    <div style={{
      background: 'rgba(18,18,22,0.92)', backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
      padding: '16px', boxShadow: '0 20px 48px rgba(0,0,0,0.8)', color: '#f4f4f5',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: isOpen ? '14px' : '0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={14} color="#c4b5fd" />
          </div>
          <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#fff' }}>
            AI Strategic Advice
          </h3>
        </div>

        <button onClick={onToggle} style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#a1a1aa', fontSize: '11px', cursor: 'pointer',
          padding: '4px 10px', borderRadius: '20px',
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
        transition: 'grid-template-rows 0.35s ease, opacity 0.28s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingTop: isOpen ? '4px' : '0' }}>

            {/* Target Path Tag */}
            {recommendation.recommended_path_id && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '11px', fontWeight: '600',
                  background: 'rgba(139,92,246,0.1)', color: '#c4b5fd',
                  border: '1px solid rgba(139,92,246,0.25)', padding: '4px 12px', borderRadius: '20px',
                }}>
                  <Target size={12} color="#c4b5fd" /> Target: {recommendation.recommended_path_id}
                </span>
              </div>
            )}

            {/* Strategic Advice Text */}
            <div style={{
              position: 'relative', background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
              padding: '12px 14px 12px 18px', marginBottom: '14px', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: '10px', bottom: '10px',
                width: '3px', borderRadius: '3px',
                background: 'linear-gradient(180deg, #8b5cf6, #ec4899)',
              }} />
              <p style={{ fontSize: '13px', color: '#e4e4e7', margin: 0, lineHeight: '1.6' }}>
                {recommendation.strategic_advice}
              </p>
            </div>

            {/* Recommended Lineage */}
            {recommendation.recommended_lineage?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <span style={{
                  fontSize: '10px', color: '#71717a', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  Recommended Lineage
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {recommendation.recommended_lineage.map((nodeId, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px', fontFamily: 'monospace',
                        background: 'rgba(255,255,255,0.05)', color: '#f4f4f5',
                        border: '1px solid rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '8px',
                      }}>
                        {nodeId}
                      </span>
                      {idx < recommendation.recommended_lineage.length - 1 && (
                        <ArrowRight size={12} color="#8b5cf6" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlight Button */}
            <button onClick={onAccept} style={{
              width: '100%',
              background: 'linear-gradient(135deg,rgba(139,92,246,0.22),rgba(99,102,241,0.15))',
              color: '#fff', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '12px',
              padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <Zap size={14} color="#c4b5fd" />
              <span>Highlight Recommendation</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

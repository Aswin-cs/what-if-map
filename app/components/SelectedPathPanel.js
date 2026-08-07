"use client";
import { Target, ArrowRight, Check, Save } from 'lucide-react';

export default function SelectedPathPanel({ selectedPathInfo, savingPath, saveSuccessMsg, onSave }) {
  if (!selectedPathInfo) return null;

  return (
    <div style={{
      background: 'rgba(18,18,22,0.92)', backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
      padding: '16px', boxShadow: '0 20px 48px rgba(0,0,0,0.8)', color: '#f4f4f5',
      animation: 'path-reveal-down 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Target size={14} color="#6ee7b7" />
        </div>
        <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0 }}>
          {selectedPathInfo.acceptedAi ? '⚡ AI Path Selected' : '🎯 Path Selected'}
        </h3>
      </div>

      {/* Node path chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {selectedPathInfo.nodeIds.map((nodeId, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontSize: '11px', fontFamily: 'monospace',
              background: 'rgba(255,215,0,0.1)', color: '#ffd700',
              border: '1px solid rgba(255,215,0,0.25)', padding: '3px 10px', borderRadius: '8px',
            }}>
              {nodeId}
            </span>
            {idx < selectedPathInfo.nodeIds.length - 1 && (
              <ArrowRight size={11} color="#ffd700" />
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={savingPath || !!saveSuccessMsg}
        style={{
          width: '100%',
          background: saveSuccessMsg
            ? 'linear-gradient(135deg,rgba(16,185,129,0.22),rgba(5,150,105,0.15))'
            : 'linear-gradient(135deg,rgba(139,92,246,0.22),rgba(99,102,241,0.15))',
          color: '#fff',
          border: saveSuccessMsg
            ? '1px solid rgba(16,185,129,0.4)'
            : '1px solid rgba(139,92,246,0.4)',
          borderRadius: '12px', padding: '10px 16px',
          fontSize: '13px', fontWeight: '600',
          cursor: savingPath ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {saveSuccessMsg ? <Check size={15} /> : <Save size={15} color="#c4b5fd" />}
        <span>
          {savingPath ? 'Saving...' : saveSuccessMsg ? 'Decision Saved!' : 'Save Chosen Path'}
        </span>
      </button>

      <style>{`
        @keyframes path-reveal-down {
          0% { opacity: 0; transform: translateY(-12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

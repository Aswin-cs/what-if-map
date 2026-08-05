import { Position, Handle } from '@xyflow/react';
import { Brain, Zap, GitFork, TrendingUp, Target } from 'lucide-react';

const CATEGORY_MAP = {
  mindset: {
    tag: 'Mindset',
    className: 'tag-mindset',
    accentColor: '#8b5cf6',
    Icon: Brain
  },
  trigger: {
    tag: 'Catalyst',
    className: 'tag-trigger',
    accentColor: '#3b82f6',
    Icon: Zap
  },
  choice: {
    tag: 'Decision',
    className: 'tag-choice',
    accentColor: '#f43f5e',
    Icon: GitFork
  },
  prediction: {
    tag: 'Forecast',
    className: 'tag-forecast',
    accentColor: '#f59e0b',
    Icon: TrendingUp
  },
  outcome: {
    tag: 'Outcome',
    className: 'tag-outcome',
    accentColor: '#10b981',
    Icon: Target
  }
};

export function CustomNode({ data, selected }) {
  const categoryKey = (data.category || 'mindset').toLowerCase();
  const config = CATEGORY_MAP[categoryKey] || CATEGORY_MAP.mindset;

  const tagLabel = data.tag || config.tag;
  const label = data.label || 'Node Title';
  const description = data.msg || data.description || '';
  const probability = data.probability !== undefined ? data.probability : null;
  const numProb = typeof probability === 'number' ? probability : parseInt(probability) || 0;
  const CategoryIcon = config.Icon;

  return (
    <div
      className={`clean-node ${selected ? 'selected' : ''} ${data.isHighlighted ? 'highlighted-gold' : ''}`}
      style={{ '--node-accent-color': config.accentColor }}
    >
      {/* Top Accent Line */}
      <div className="node-top-accent" />

      {/* Target Handle */}
      <Handle type="target" position={Position.Left} id="target-left" />

      {/* Header Row */}
      <div className="node-header-row">
        <span className={`node-tag ${config.className}`}>
          <CategoryIcon size={12} />
          {tagLabel}
        </span>
        {probability !== null && (
          <span className="node-prob-badge">
            {typeof probability === 'number' ? `${probability}%` : probability}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="node-heading">{label}</div>
      {description && <div className="node-subtext">{description}</div>}

      {/* Probability Progress Bar */}
      {probability !== null && numProb > 0 && (
        <div className="node-prob-meter-bg">
          <div
            className="node-prob-meter-fill"
            style={{
              width: `${Math.min(100, Math.max(0, numProb))}%`,
              background: config.accentColor,
              boxShadow: `0 0 8px ${config.accentColor}`
            }}
          />
        </div>
      )}

      {/* Source Handle */}
      <Handle type="source" position={Position.Right} id="source-right" />
    </div>
  );
}

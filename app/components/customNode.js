import { Position, Handle } from '@xyflow/react';

export function CustomNode({ data, selected }) {
  const label = data.label || 'Node Title';
  const description = data.msg || data.description || '';
  const probability = data.probability !== undefined ? data.probability : null;
  const numProb = typeof probability === 'number' ? probability : parseInt(probability) || 0;

  return (
    <div className={`glass-node ${selected ? 'selected' : ''} ${data.isHighlighted ? 'highlighted-gold' : ''}`}>
      <Handle type="target" position={Position.Left} id="target-left" className="node-handle target" />
      
      <div className="node-content">
        <div className="node-title">{label}</div>
        {description && <div className="node-desc">{description}</div>}
        
        {probability !== null && numProb > 0 && (
          <div className="node-prob-container">
            <div className="node-prob-bar">
              <div 
                className="node-prob-fill" 
                style={{ width: `${Math.min(100, Math.max(0, numProb))}%` }} 
              />
            </div>
            <span className="node-prob-text">{numProb}% Probability</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="source-right" className="node-handle source" />
    </div>
  );
}

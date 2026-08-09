import { Position, Handle } from '@xyflow/react';

export function CustomNode({ data, selected }) {
  const label = data.label || 'Node Title';
  const description = data.msg || data.description || '';

  return (
    <div className={`glass-node ${selected ? 'selected' : ''} ${data.isHighlighted ? 'highlighted-gold' : ''}`}>
      <Handle type="target" position={Position.Left} id="target-left" className="node-handle target" />
      
      <div className="node-content">
        <div className="node-title">{label}</div>
        {description && <div className="node-desc">{description}</div>}
      </div>

      <Handle type="source" position={Position.Right} id="source-right" className="node-handle source" />
    </div>
  );
}


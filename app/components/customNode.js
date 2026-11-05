"use client";
import { useState, useRef, useEffect, memo } from 'react';
import { Position, Handle } from '@xyflow/react';

export const CustomNode = memo(function CustomNode({ data, selected }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const descRef = useRef(null);

  const label = data?.label || 'Node Title';
  const description = data?.msg || data?.description || '';

  useEffect(() => {
    const el = descRef.current;
    if (!el || !description) {
      return;
    }

    const checkOverflow = () => {
      if (!isExpanded && el) {
        setHasOverflow(el.scrollHeight > el.clientHeight + 1);
      }
    };

    checkOverflow();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(checkOverflow);
      observer.observe(el);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [description, isExpanded]);

  const handleNodeClick = () => {
    if (hasOverflow) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div
      onClick={handleNodeClick}
      className={`glass-node ${selected ? 'selected' : ''} ${data?.isHighlighted ? 'highlighted-gold' : ''} ${isExpanded ? 'expanded' : ''} ${hasOverflow ? 'clickable-expandable' : ''}`}
      title={hasOverflow ? (isExpanded ? "Click node to collapse" : "Click node to expand full text") : undefined}
    >
      <Handle type="target" position={Position.Left} id="target-left" className="node-handle target" />
      
      <div className="node-content">
        <div className="node-title">{label}</div>
        {description && (
          <div className="node-desc-container">
            <div
              ref={descRef}
              className={`node-desc ${isExpanded ? 'expanded' : 'clamped'}`}
            >
              {description}
            </div>
            {hasOverflow && (
              <div className="node-expand-toggle">
                <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                <span className={`toggle-chevron ${isExpanded ? 'open' : ''}`}>▾</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="source-right" className="node-handle source" />
    </div>
  );
});

export default CustomNode;

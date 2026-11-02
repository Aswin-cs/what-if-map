"use client";
import { useState, useRef, useEffect } from 'react';
import { Position, Handle } from '@xyflow/react';

export function CustomNode({ data, selected }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const descRef = useRef(null);

  const label = data.label || 'Node Title';
  const description = data.msg || data.description || '';

  useEffect(() => {
    const el = descRef.current;
    if (!el || !description) {
      setHasOverflow(false);
      return;
    }

    const checkOverflow = () => {
      // When clamped, el.scrollHeight > el.clientHeight indicates real visual overflow
      if (!isExpanded) {
        const overflows = el.scrollHeight > el.clientHeight + 1;
        setHasOverflow(overflows);
      }
    };

    checkOverflow();

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(checkOverflow);
    }

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(checkOverflow);
      observer.observe(el);
    }

    window.addEventListener('resize', checkOverflow);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', checkOverflow);
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
      className={`glass-node ${selected ? 'selected' : ''} ${data.isHighlighted ? 'highlighted-gold' : ''} ${isExpanded ? 'expanded' : ''} ${hasOverflow ? 'clickable-expandable' : ''}`}
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
}


import { useCallback, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { Position, useUpdateNodeInternals } from 'reactflow';
import { BaseNode, StyledLabel, StyledTextarea } from './BaseNode';
import { useStore } from '../store';

// Check if a string is a valid JavaScript variable identifier
export const isValidVariable = (name) => {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
};

// Extract unique valid variable names from text
export const extractVariables = (text) => {
  const seen = new Set();
  const variables = [];
  
  // Find all matches for {{...}}
  const regex = /\{\{\s*([^}]+)\s*\}\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const rawName = match[1].trim();
    if (isValidVariable(rawName) && !seen.has(rawName)) {
      seen.add(rawName);
      variables.push(rawName);
    }
  }
  
  return variables;
};

// CSS keyframes for entering chips
const chipStyleSheet = `
@keyframes chipEnter {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.variable-chip {
  animation: chipEnter 180ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
`;

export const TextNode = ({ id, data, selected }) => {
  const [currText, setCurrText] = useState(data?.text || '{{input}}');
  const textareaRef = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Sync state to Zustand store on initial load
  useEffect(() => {
    if (data?.text === undefined) {
      updateNodeField(id, 'text', currText);
    }
  }, [id, data?.text, currText, updateNodeField]);

  // Extract variables, memoized to only recalculate on text change
  const variables = useMemo(
    () => extractVariables(currText),
    [currText]
  );

  // Calculate dynamic handles based on extracted variables
  const handles = useMemo(() => {
    const variableHandles = variables.map((name, index) => {
      // Calculate a fixed top position based on index, e.g. 52px for header, then 32px per handle
      const topOffset = 52 + (index * 32);
      return {
        type: 'target',
        position: Position.Left,
        id: `${id}-${name}`,
        label: name,
        style: {
          top: `${topOffset}px`,
        },
      };
    });

    return [
      ...variableHandles,
      // Keep the existing source output handle on the right
      { type: 'source', position: Position.Right, id: `${id}-output` },
    ];
  }, [id, variables]);

  const syncTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to calculate scrollHeight correctly
    textarea.style.height = 'auto';
    
    // Auto-grow height based on scrollHeight, capped at max height
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(300, Math.max(72, scrollHeight));
    
    textarea.style.height = `${newHeight}px`;
    
    // Enable scrollbar if it exceeds the maximum height
    textarea.style.overflowY = scrollHeight > 300 ? 'auto' : 'hidden';
  }, []);

  // Update ReactFlow node internals to recalculate handle positions whenever they change
  useLayoutEffect(() => {
    syncTextareaHeight();
    updateNodeInternals(id);
  }, [currText, variables, id, syncTextareaHeight, updateNodeInternals]);

  // Dynamically increase minHeight as variables grow to allow space for handles,
  // starting at 90px minimum, and ensuring at least 52 + variables.length * 32
  const minHeight = useMemo(
    () => Math.max(90, 52 + variables.length * 32),
    [variables.length]
  );

  const handleTextChange = (e) => {
    const value = e.target.value;
    setCurrText(value);
    updateNodeField(id, 'text', value);
  };

  return (
    <BaseNode
      title="Text"
      width={250}
      minHeight={minHeight}
      handles={handles}
      selected={selected}
      executionStatus={data?.executionStatus}
    >
      <StyledLabel>
        Template
        <StyledTextarea
          ref={textareaRef}
          value={currText}
          onChange={handleTextChange}
          placeholder="Enter text with {{variables}}"
          style={{
            transition: 'height 0.1s ease-out, border-color 0.2s, box-shadow 0.2s', // Smooth resizing transitions
          }}
        />
      </StyledLabel>

      {/* Render detected variables as clean, animated chips */}
      {variables.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <style>{chipStyleSheet}</style>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Detected Variables
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {variables.map((name) => (
              <span
                key={name}
                className="variable-chip"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  color: 'var(--color-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  pointerEvents: 'none',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </BaseNode>
  );
};

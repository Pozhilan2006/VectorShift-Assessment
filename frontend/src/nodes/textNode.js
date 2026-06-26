import { useCallback, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { Position, useUpdateNodeInternals } from 'reactflow';
import { BaseNode, StyledLabel, StyledTextarea } from './BaseNode';
import { useStore } from '../store';

// Regex to capture anything inside {{ }} as a variable name
const VARIABLE_REGEX = /\{\{\s*(\w+)\s*\}\}/g;
const TEXTAREA_MIN_HEIGHT = 72;
const TEXTAREA_MAX_HEIGHT = 300;

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

// Helper to extract unique variables
const extractUniqueVariables = (text) => {
  const seen = new Set();
  const variables = [];

  for (const match of text.matchAll(VARIABLE_REGEX)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      variables.push(name);
    }
  }

  return variables;
};

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
    () => extractUniqueVariables(currText),
    [currText]
  );

  // Calculate dynamic handles based on extracted variables
  const handles = useMemo(() => {
    // Generate evenly spaced handles vertically for each variable
    const variableHandles = variables.map((name, index) => ({
      type: 'target',
      position: Position.Left,
      id: `${id}-var-${name}`,
      label: name,
      style: {
        // Distribute evenly between 0 and 100%
        top: `${((index + 1) / (variables.length + 1)) * 100}%`,
      },
    }));

    return [
      ...variableHandles,
      // Keep the existing output handle
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
    const newHeight = Math.min(TEXTAREA_MAX_HEIGHT, Math.max(TEXTAREA_MIN_HEIGHT, scrollHeight));
    
    textarea.style.height = `${newHeight}px`;
    
    // Enable scrollbar if it exceeds the maximum height
    textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  // Update ReactFlow node internals to recalculate handle positions whenever they change
  useLayoutEffect(() => {
    syncTextareaHeight();
    updateNodeInternals(id);
  }, [currText, variables, id, syncTextareaHeight, updateNodeInternals]);

  // Dynamically increase minHeight as variables grow to allow space for the handles, starting at 90px
  const minHeight = useMemo(
    () => Math.max(90, 80 + variables.length * 20),
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
      width={240}
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
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
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
                  color: '#2563EB',
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

// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, { Controls, Background, MiniMap, MarkerType } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { PromptNode } from './nodes/promptNode';
import { ConditionNode } from './nodes/conditionNode';
import { ApiNode } from './nodes/apiNode';
import { TransformNode } from './nodes/transformNode';
import { DatabaseNode } from './nodes/databaseNode';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  prompt: PromptNode,
  condition: ConditionNode,
  api: ApiNode,
  transform: TransformNode,
  database: DatabaseNode,
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

// MiniMap styling helper
const miniMapStyle = {
  backgroundColor: 'var(--bg-panels-opaque)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  boxShadow: '0 2px 8px var(--shadow-color)',
  overflow: 'hidden',
};

// Controls styling helper
const controlsStyle = {
  backgroundColor: 'var(--bg-panels-opaque)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  boxShadow: '0 2px 8px var(--shadow-color)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
};

// Connection line style while creating connection
const connectionLineStyle = {
  stroke: '#3B82F6', // Premium Blue
  strokeWidth: 2.5, // Slightly thicker stroke
};

// Default styling settings for all created edges
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: {
    stroke: '#3B82F6', // Professional blue color
    strokeWidth: 2.5, // Slightly thicker stroke
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#3B82F6', // Matching Arrow color
  },
};

// Floating Pipeline Statistics Panel (Phase 9)
const PipelineInfoCard = () => {
  const { nodes, edges } = useStore(
    (state) => ({ nodes: state.nodes, edges: state.edges }),
    shallow
  );

  const variablesCount = useMemo(() => {
    const VARIABLE_REGEX = /\{\{\s*(\w+)\s*\}\}/g;
    const seen = new Set();
    nodes.forEach((node) => {
      if (node.type === 'text') {
        const text = node.data?.text || '';
        for (const match of text.matchAll(VARIABLE_REGEX)) {
          seen.add(match[1]);
        }
      }
    });
    return seen.size;
  }, [nodes]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '140px',
        right: '16px',
        zIndex: 10,
        width: '160px',
        background: 'var(--bg-panels-opaque)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px var(--shadow-color)',
        padding: '12px 14px',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        fontSize: '10.5px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border-color-subtle)',
        paddingBottom: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        Pipeline Statistics
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[
          { label: 'Nodes', value: nodes.length },
          { label: 'Edges', value: edges.length },
          { label: 'Variables', value: variablesCount },
          { label: 'Connections', value: edges.length }
        ].map((item) => (
          <div key={item.label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PipelineUI = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const {
      nodes,
      edges,
      getNodeID,
      addNode,
      onNodesChange,
      onEdgesChange,
      onConnect
    } = useStore(selector, shallow);

    const getInitNodeData = (nodeID, type) => {
      let nodeData = { id: nodeID, nodeType: `${type}` };
      return nodeData;
    }

    const isExecuting = useStore((state) => state.isExecuting);
    const theme = useStore((state) => state.theme);

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();
          if (isExecuting) return;
    
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          if (event?.dataTransfer?.getData('application/reactflow')) {
            const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
            const type = appData?.nodeType;
      
            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
              return;
            }
      
            const position = reactFlowInstance.project({
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top,
            });

            const nodeID = getNodeID(type);
            const newNode = {
              id: nodeID,
              type,
              position,
              data: getInitNodeData(nodeID, type),
            };
      
            addNode(newNode);
          }
        },
        [reactFlowInstance, isExecuting, addNode, getNodeID]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        if (isExecuting) {
          event.dataTransfer.dropEffect = 'none';
        } else {
          event.dataTransfer.dropEffect = 'move';
        }
    }, [isExecuting]);

    return (
        <>
        <div 
          ref={reactFlowWrapper} 
          style={{
            width: '100%', 
            height: '100%',
            background: 'var(--bg-canvas)',
            position: 'relative'
          }}
        >
            {/* Inline stylesheet to handle connection path animation and edge hovers */}
            <style>{`
              .react-flow__connection-path {
                stroke-dasharray: 6;
                animation: dash-animation 1s linear infinite;
              }
              @keyframes dash-animation {
                from {
                  stroke-dashoffset: 12;
                }
                to {
                  stroke-dashoffset: 0;
                }
              }
              /* Established edge path hover & active/selected styling */
              .react-flow__edge-path {
                transition: stroke 150ms ease, stroke-width 150ms ease, filter 150ms ease;
              }
              .react-flow__edge:hover .react-flow__edge-path {
                stroke: #2563EB !important; /* Richer dark blue on hover */
                stroke-width: 3.5px !important;
              }
              .react-flow__edge.selected .react-flow__edge-path {
                stroke: #1D4ED8 !important; /* Selected dark blue */
                stroke-width: 3.5px !important;
                filter: drop-shadow(0 2px 6px rgba(37, 99, 235, 0.4));
              }
              .react-flow__edge:hover .react-flow__edge-interaction {
                stroke-width: 20px;
              }
              
              /* ReactFlow theme overrides */
              .react-flow__controls-button {
                background: var(--bg-cards-opaque) !important;
                border-bottom: 1px solid var(--border-color) !important;
                fill: var(--text-primary) !important;
                color: var(--text-primary) !important;
              }
              .react-flow__controls-button:hover {
                background: var(--bg-cards-hover) !important;
              }
              .react-flow__controls-button svg {
                fill: currentColor !important;
              }
            `}</style>

            {/* Centered empty canvas state */}
            {nodes.length === 0 && (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none', // Ensures drops pass through to the ReactFlow wrapper
                  zIndex: 5,
                  userSelect: 'none',
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  maxWidth: '340px',
                  textAlign: 'center',
                  padding: '32px 24px',
                  background: 'var(--bg-panels-opaque)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color)',
                  boxShadow: '0 4px 12px var(--shadow-color)',
                }}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                  </svg>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                       Build your workflow
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
                       Drag nodes from the toolbar to begin creating a pipeline.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Render floating statistics HUD if nodes are present */}
            {nodes.length > 0 && <PipelineInfoCard />}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                proOptions={proOptions}
                snapGrid={[gridSize, gridSize]}
                connectionLineType='smoothstep'
                connectionLineStyle={connectionLineStyle}
                defaultEdgeOptions={defaultEdgeOptions}
                nodesDraggable={!isExecuting}
                nodesConnectable={!isExecuting}
                elementsSelectable={!isExecuting}
                deleteKeyCode={["Backspace", "Delete"]}
            >
                <Background color={theme === 'dark' ? 'rgba(74, 85, 104, 0.45)' : 'rgba(203, 213, 225, 0.5)'} gap={gridSize} size={1.5} /> {/* Lighter dots */}
                <Controls style={controlsStyle} /> {/* Rounded controls */}
                <MiniMap style={miniMapStyle} maskColor={theme === 'dark' ? 'rgba(11, 15, 23, 0.6)' : 'rgba(248, 250, 252, 0.4)'} nodeColor={theme === 'dark' ? '#3b82f6' : '#2563eb'} /> {/* Better minimap styling */}
            </ReactFlow>
        </div>
        </>
    )
}

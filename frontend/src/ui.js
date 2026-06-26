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
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
};

// Controls styling helper
const controlsStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
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
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
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
        color: '#64748B',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
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
            color: '#334155'
          }}>
            <span style={{ color: '#64748B', fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.value}</span>
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

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();
    
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
        [reactFlowInstance]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    return (
        <>
        <div 
          ref={reactFlowWrapper} 
          style={{
            width: '100%', 
            height: '70vh',
            background: 'radial-gradient(circle, #f8fafc 0%, #f1f5f9 100%)', // Subtle gradient
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
                  background: 'rgba(255, 255, 255, 0.45)',
                  borderRadius: '16px',
                  border: '1px dashed #CBD5E1',
                  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.04)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                  </svg>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#475569' }}>
                      Build your workflow
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.45, color: '#64748B' }}>
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
            >
                <Background color="#CBD5E1" gap={gridSize} size={1.5} /> {/* Lighter dots */}
                <Controls style={controlsStyle} /> {/* Rounded controls */}
                <MiniMap style={miniMapStyle} maskColor="rgba(241, 245, 249, 0.4)" nodeColor="#3B82F6" /> {/* Better minimap styling */}
            </ReactFlow>
        </div>
        </>
    )
}

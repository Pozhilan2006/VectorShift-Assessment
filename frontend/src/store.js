// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';

export const useStore = create((set, get) => ({
    nodes: [],
    edges: [],
    nodeIDs: {},
    
    // Execution Simulation States
    isExecuting: false,
    executionStatus: 'idle', // 'idle' | 'running' | 'completed' | 'failed'
    executionNodes: {},      // { [nodeId]: 'pending' | 'running' | 'completed' | 'failed' }
    executionLogs: [],       // [ { message, type, timestamp } ]
    executionContext: {},    // { [variableName]: value }
    executionStats: null,    // { duration, nodeCount, variablesCount, apiCallsCount, dbOpsCount, success }

    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      set({
        edges: addEdge({
          ...connection,
          type: 'smoothstep',
          animated: false, // solid stroke for established connections
          style: {
            stroke: '#3B82F6', // Professional blue
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#3B82F6',
          }
        }, get().edges),
      });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            node.data = { ...node.data, [fieldName]: fieldValue };
          }
   
          return node;
        }),
      });
    },

    // --- Execution Simulator Actions ---
    startExecution: () => {
      // Reset all nodes and edges styling to neutral before start
      const cleanNodes = get().nodes.map(n => ({
        ...n,
        data: { ...n.data, executionStatus: 'pending' }
      }));
      
      const cleanEdges = get().edges.map(e => ({
        ...e,
        animated: false,
        style: {
          stroke: '#3B82F6',
          strokeWidth: 2,
          opacity: 1
        }
      }));

      const initialExecNodes = {};
      get().nodes.forEach(n => {
        initialExecNodes[n.id] = 'pending';
      });

      set({
        nodes: cleanNodes,
        edges: cleanEdges,
        isExecuting: true,
        executionStatus: 'running',
        executionNodes: initialExecNodes,
        executionLogs: [],
        executionContext: {},
        executionStats: null
      });
    },

    updateNodeStatus: (nodeId, status) => {
      set({
        executionNodes: {
          ...get().executionNodes,
          [nodeId]: status
        },
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, executionStatus: status }
            };
          }
          return node;
        })
      });
    },

    addExecutionLog: (message, type = 'info') => {
      set({
        executionLogs: [
          ...get().executionLogs,
          { message, type, timestamp: Date.now() }
        ]
      });
    },

    updateExecutionContext: (update) => {
      set({
        executionContext: {
          ...get().executionContext,
          ...update
        }
      });
    },

    setExecutionStats: (stats) => {
      set({ executionStats: stats });
    },

    finishExecution: (success) => {
      set({
        isExecuting: false,
        executionStatus: success ? 'completed' : 'failed'
      });
    },

    setEdgeStyle: (edgeId, style, animated) => {
      set({
        edges: get().edges.map(e => {
          if (e.id === edgeId) {
            return {
              ...e,
              animated: animated || false,
              style: {
                ...e.style,
                ...style
              },
              markerEnd: {
                ...e.markerEnd,
                color: style.stroke || '#3B82F6'
              }
            };
          }
          return e;
        })
      });
    },

    resetExecutionState: () => {
      const cleanNodes = get().nodes.map(n => ({
        ...n,
        data: { ...n.data, executionStatus: undefined }
      }));
      
      const cleanEdges = get().edges.map(e => ({
        ...e,
        animated: false,
        style: {
          stroke: '#3B82F6',
          strokeWidth: 2,
          opacity: 1
        },
        markerEnd: {
          ...e.markerEnd,
          color: '#3B82F6'
        }
      }));

      set({
        nodes: cleanNodes,
        edges: cleanEdges,
        isExecuting: false,
        executionStatus: 'idle',
        executionNodes: {},
        executionLogs: [],
        executionContext: {},
        executionStats: null
      });
    }
  }));

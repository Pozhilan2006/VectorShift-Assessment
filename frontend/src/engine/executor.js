// engine/executor.js

import { getTopologicalOrder } from './graph';
import { getIncomingValues } from './variableResolver';
import { executeInputNode } from './executors/inputExecutor';
import { executeTextNode } from './executors/textExecutor';
import { executePromptNode } from './executors/promptExecutor';
import { executeTransformNode } from './executors/transformExecutor';
import { executeApiNode } from './executors/apiExecutor';
import { executeDatabaseNode } from './executors/databaseExecutor';
import { executeConditionNode } from './executors/conditionExecutor';
import { executeOutputNode } from './executors/outputExecutor';
import { NodeStatus } from './types';

// Generic executor for node types that don't have specialized behavior (like LLM node)
const executeGenericNode = async (node, inputs, context) => {
  const inputVal = Object.values(inputs)[0] || '';
  return {
    value: inputVal,
    log: `Node "${node.id}" (${node.type}) executed. Output passed through.`
  };
};

const getExecutor = (nodeType) => {
  switch (nodeType) {
    case 'customInput':
      return executeInputNode;
    case 'text':
      return executeTextNode;
    case 'prompt':
      return executePromptNode;
    case 'transform':
      return executeTransformNode;
    case 'api':
      return executeApiNode;
    case 'database':
      return executeDatabaseNode;
    case 'condition':
      return executeConditionNode;
    case 'customOutput':
      return executeOutputNode;
    default:
      return executeGenericNode;
  }
};

/**
 * Runs the pipeline simulator sequentially in topological order.
 * Updates Zustand store state to reflect live execution status, logging, and statistics.
 */
export const runPipelineSimulation = async (store) => {
  const { 
    nodes, 
    edges,
    startExecution,
    updateNodeStatus,
    addExecutionLog,
    updateExecutionContext,
    setExecutionStats,
    finishExecution,
    setEdgeStyle
  } = store;

  // Clear previous runs & set status to running
  startExecution();
  addExecutionLog('Initiating workflow execution simulator...', 'info');

  const startTime = Date.now();
  let topologicalOrder = [];

  try {
    topologicalOrder = getTopologicalOrder(nodes, edges);
    addExecutionLog('Topological sort completed. No cycles detected.', 'success');
  } catch (err) {
    addExecutionLog(`Topology Error: ${err.message}`, 'error');
    finishExecution(false);
    return;
  }

  // Active execution variables
  const nodeOutputs = {};
  const context = {};
  
  // Running stats counters
  let executedCount = 0;
  let apiCallsCount = 0;
  let dbOpsCount = 0;

  for (let i = 0; i < topologicalOrder.length; i++) {
    const nodeId = topologicalOrder[i];
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;

    // 1. Mark node as RUNNING
    updateNodeStatus(nodeId, NodeStatus.RUNNING);
    addExecutionLog(`Executing node: ${node.id} (${node.type || 'generic'})...`, 'info');
    
    // Resolve inputs from parent nodes
    const inputs = getIncomingValues(nodeId, edges, nodeOutputs);

    // 2. Add visual delay (250ms - 400ms per node)
    await new Promise(resolve => setTimeout(resolve, 350));

    try {
      const executor = getExecutor(node.type);
      const result = await executor(node, inputs, context);

      // Save node output
      nodeOutputs[nodeId] = result.value;
      executedCount++;

      // Track specialized node stats
      if (result.apiStat) apiCallsCount++;
      if (result.dbStat) dbOpsCount++;

      // 3. Update context & logs
      if (result.contextUpdate) {
        updateExecutionContext(result.contextUpdate);
      }
      
      updateNodeStatus(nodeId, NodeStatus.COMPLETED);
      addExecutionLog(result.log || `Node ${node.id} executed successfully.`, 'success');

      // 4. Animate and style target edges
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        // Handle condition node branch fading
        if (node.type === 'condition' && result.conditionBranch) {
          const isSelectedBranch = edge.sourceHandle === `${nodeId}-${result.conditionBranch}`;
          if (isSelectedBranch) {
            setEdgeStyle(edge.id, {
              stroke: '#10B981', // Green for active branch
              strokeWidth: 3.5,
            }, true); // animated: true
          } else {
            setEdgeStyle(edge.id, {
              stroke: '#CBD5E1', // Faded gray for inactive branch
              strokeWidth: 1.5,
              opacity: 0.3
            }, false); // animated: false
          }
        } else {
          // Standard edge activation
          setEdgeStyle(edge.id, {
            stroke: '#10B981', // Green for executed flow path
            strokeWidth: 3,
          }, true); // animated: true
        }
      }

    } catch (err) {
      // Mark node as FAILED and abort
      updateNodeStatus(nodeId, NodeStatus.FAILED);
      addExecutionLog(`Error in node '${node.id}': ${err.message}`, 'error');
      
      // Animate outgoing edges of failed node to red/faded
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        setEdgeStyle(edge.id, {
          stroke: '#EF4444',
          strokeWidth: 2,
          opacity: 0.5
        }, false);
      }

      finishExecution(false);
      
      const totalDuration = Date.now() - startTime;
      setExecutionStats({
        duration: totalDuration,
        nodeCount: executedCount,
        variablesCount: Object.keys(context).length,
        apiCallsCount,
        dbOpsCount,
        success: false
      });
      return;
    }
  }

  const totalDuration = Date.now() - startTime;
  addExecutionLog(`Workflow execution completed successfully in ${totalDuration}ms.`, 'success');
  finishExecution(true);
  
  setExecutionStats({
    duration: totalDuration,
    nodeCount: executedCount,
    variablesCount: Object.keys(context).length,
    apiCallsCount,
    dbOpsCount,
    success: true
  });
};

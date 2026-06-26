// engine/variableResolver.js

/**
 * Gathers incoming connection values for a specific node from all active parent outputs.
 */
export const getIncomingValues = (nodeId, edges, nodeOutputs) => {
  const inputs = {};
  
  // Find all edges that target this node
  const incomingEdges = edges.filter(e => e.target === nodeId);
  
  for (const edge of incomingEdges) {
    const sourceOutput = nodeOutputs[edge.source];
    
    // In case the parent is a condition node, its output depends on which handle was activated
    let sourceValue = sourceOutput;
    if (sourceOutput && typeof sourceOutput === 'object' && 'trueValue' in sourceOutput) {
      if (edge.sourceHandle === `${edge.source}-true`) {
        sourceValue = sourceOutput.trueValue;
      } else if (edge.sourceHandle === `${edge.source}-false`) {
        sourceValue = sourceOutput.falseValue;
      } else {
        sourceValue = sourceOutput.value;
      }
    }

    const targetHandle = edge.targetHandle || '';
    const prefix = `${nodeId}-`;
    
    if (targetHandle.startsWith(prefix)) {
      const varName = targetHandle.substring(prefix.length);
      inputs[varName] = sourceValue;
    } else {
      // Default fallback input key
      inputs['input'] = sourceValue;
    }
  }
  
  return inputs;
};

// engine/executors/inputExecutor.js

export const executeInputNode = async (node, inputs, context) => {
  const name = node.data?.inputName || node.id;
  const val = node.data?.sampleValue || '';
  
  // Store inside the execution context for downstream resolution
  context[name] = val;
  
  return {
    value: val,
    log: `Input resolved: "${name}" = "${val}"`,
    contextUpdate: { [name]: val }
  };
};

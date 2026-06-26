// engine/executors/outputExecutor.js

export const executeOutputNode = async (node, inputs, context) => {
  const inputVal = Object.values(inputs)[0] || '';
  const outputName = node.data?.outputName || node.id;
  const outputType = node.data?.outputType || 'Text';
  
  let formatted = inputVal;
  if (outputType === 'JSON') {
    try {
      const parsed = typeof inputVal === 'string' ? JSON.parse(inputVal) : inputVal;
      formatted = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Keep original value if parsing fails
    }
  }
  
  // Save to context
  context[outputName] = formatted;
  
  return {
    value: formatted,
    log: `Output generated for "${outputName}".`,
    contextUpdate: { [outputName]: formatted }
  };
};

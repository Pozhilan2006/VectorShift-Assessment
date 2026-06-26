// engine/executors/textExecutor.js

export const executeTextNode = async (node, inputs, context) => {
  const text = node.data?.text || '';
  return {
    value: text,
    log: `Static text node output: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
  };
};

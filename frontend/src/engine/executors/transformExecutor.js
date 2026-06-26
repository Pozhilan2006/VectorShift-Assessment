// engine/executors/transformExecutor.js

export const executeTransformNode = async (node, inputs, context) => {
  // Get input from first connected input or default
  const inputVal = Object.values(inputs)[0] || '';
  const transformType = node.data?.transformType || 'Uppercase';
  let transformed = String(inputVal);
  
  switch (transformType) {
    case 'Uppercase':
      transformed = transformed.toUpperCase();
      break;
    case 'Lowercase':
      transformed = transformed.toLowerCase();
      break;
    case 'Trim':
      transformed = transformed.trim();
      break;
    case 'Reverse':
      transformed = transformed.split('').reverse().join('');
      break;
    case 'Capitalize':
      transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
      break;
    case 'JSON Pretty Print':
      try {
        const parsed = JSON.parse(transformed);
        transformed = JSON.stringify(parsed, null, 2);
      } catch (err) {
        throw new Error(`Invalid JSON format for JSON Pretty Print transformation in node '${node.id}'.`);
      }
      break;
    case 'Remove Extra Spaces':
      transformed = transformed.replace(/\s+/g, ' ').trim();
      break;
    default:
      break;
  }
  
  return {
    value: transformed,
    log: `Applied transformation "${transformType}".`
  };
};

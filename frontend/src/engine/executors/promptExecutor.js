// engine/executors/promptExecutor.js

export const executePromptNode = async (node, inputs, context) => {
  const template = node.data?.template || '';
  
  // Find all matches for {{variable}}
  const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
  let rendered = template;
  let match;
  
  // Reset regex index
  variableRegex.lastIndex = 0;
  
  const missingVars = [];
  
  while ((match = variableRegex.exec(template)) !== null) {
    const varName = match[1];
    
    // Check if the variable is provided by incoming edges or context
    let resolvedValue = undefined;
    if (inputs[varName] !== undefined) {
      resolvedValue = inputs[varName];
    } else if (context[varName] !== undefined) {
      resolvedValue = context[varName];
    }
    
    if (resolvedValue === undefined) {
      missingVars.push(varName);
    } else {
      rendered = rendered.replace(match[0], String(resolvedValue));
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Execution halted: Unknown variable(s) [${missingVars.join(', ')}] in Prompt node '${node.id}'. Connect an input node or pass parameters in context.`);
  }
  
  return {
    value: rendered,
    log: `Prompt template rendered successfully.`,
    contextUpdate: { [`prompt_${node.id}`]: rendered }
  };
};

// engine/executors/conditionExecutor.js

export const executeConditionNode = async (node, inputs, context) => {
  const conditionName = node.data?.conditionName || 'Condition';
  const expression = node.data?.expression || '';
  
  if (!expression) {
    throw new Error(`Condition Node '${node.id}' requires an expression to evaluate.`);
  }

  const getValue = (name) => {
    // Look up in inputs first, then context
    if (inputs[name] !== undefined) return inputs[name];
    if (context[name] !== undefined) return context[name];
    
    // Fallback: check if the first input's value has this property if it's an object
    const firstInput = Object.values(inputs)[0];
    if (firstInput && typeof firstInput === 'object' && firstInput[name] !== undefined) {
      return firstInput[name];
    }
    
    return '';
  };

  const exprClean = expression.trim();
  let evaluation = false;
  
  // 1. length(var) > num
  let match = exprClean.match(/^length\((\w+)\)\s*(>|<|==|!=)\s*(\d+)$/);
  if (match) {
    const [, varName, op, numStr] = match;
    const val = String(getValue(varName));
    const num = parseInt(numStr, 10);
    const len = val.length;
    if (op === '>') evaluation = len > num;
    else if (op === '<') evaluation = len < num;
    else if (op === '==') evaluation = len === num;
    else if (op === '!=') evaluation = len !== num;
  }
  
  // 2. contains(var, text)
  else if ((match = exprClean.match(/^contains\((\w+),\s*['"]?([^'"]+)['"]?\)$/))) {
    const [, varName, text] = match;
    const val = String(getValue(varName));
    evaluation = val.includes(text);
  }
  
  // 3. startsWith(var, text)
  else if ((match = exprClean.match(/^startsWith\((\w+),\s*['"]?([^'"]+)['"]?\)$/))) {
    const [, varName, text] = match;
    const val = String(getValue(varName));
    evaluation = val.startsWith(text);
  }
  
  // 4. endsWith(var, text)
  else if ((match = exprClean.match(/^endsWith\((\w+),\s*['"]?([^'"]+)['"]?\)$/))) {
    const [, varName, text] = match;
    const val = String(getValue(varName));
    evaluation = val.endsWith(text);
  }
  
  // 5. var == val
  else if ((match = exprClean.match(/^(\w+)\s*(==|!=)\s*['"]?([^'"]+)['"]?$/))) {
    const [, varName, op, valStr] = match;
    const val = String(getValue(varName));
    if (op === '==') evaluation = (val === valStr);
    else if (op === '!=') evaluation = (val !== valStr);
  }
  
  // Fallback: evaluate the first connected input as truthy/falsy
  else {
    const firstInputVal = Object.values(inputs)[0] || '';
    evaluation = String(firstInputVal).length > 0;
  }

  const branch = evaluation ? 'true' : 'false';
  const valToPass = Object.values(inputs)[0] || '';

  // Condition node generates custom output structure
  return {
    value: {
      trueValue: evaluation ? valToPass : null,
      falseValue: evaluation ? null : valToPass,
      value: valToPass,
      conditionResult: evaluation
    },
    log: `Condition "${conditionName}" evaluated to ${evaluation.toString().toUpperCase()} (Branch: "${branch}").`,
    conditionBranch: branch
  };
};

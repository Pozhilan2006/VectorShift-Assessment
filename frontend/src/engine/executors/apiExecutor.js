// engine/executors/apiExecutor.js

export const executeApiNode = async (node, inputs, context) => {
  const url = node.data?.url || '';
  const method = node.data?.method || 'GET';
  
  if (!url) {
    throw new Error(`API Node '${node.id}' requires a valid URL.`);
  }
  
  if (method !== 'GET') {
    throw new Error(`API Node '${node.id}' only supports GET operations in simulation mode.`);
  }

  const startTime = Date.now();
  try {
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    const preview = typeof responseData === 'object' 
      ? JSON.stringify(responseData).substring(0, 100) + '...'
      : String(responseData).substring(0, 100);
      
    // Save to context
    const contextKey = `api_response_${node.id}`;
    context[contextKey] = responseData;

    return {
      value: responseData,
      log: `GET ${url} completed in ${duration}ms. Status: ${response.status}.`,
      apiStat: {
        statusCode: response.status,
        duration,
        preview
      },
      contextUpdate: { [contextKey]: responseData }
    };
  } catch (err) {
    throw new Error(`API Request to ${url} failed: ${err.message}`);
  }
};

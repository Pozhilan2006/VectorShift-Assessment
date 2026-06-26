// engine/graph.js

/**
 * Performs a topological sort on the nodes based on the connections (edges).
 * Uses Kahn's algorithm. Returns a list of node IDs in execution order.
 */
export const getTopologicalOrder = (nodes, edges) => {
  const nodeIds = nodes.map(n => n.id);
  const adjacency = {};
  const inDegree = {};

  for (const nid of nodeIds) {
    adjacency[nid] = [];
    inDegree[nid] = 0;
  }

  for (const edge of edges) {
    if (adjacency[edge.source] && inDegree[edge.target] !== undefined) {
      adjacency[edge.source].push(edge.target);
      inDegree[edge.target]++;
    }
  }

  const queue = nodeIds.filter(nid => inDegree[nid] === 0);
  const order = [];

  while (queue.length > 0) {
    const curr = queue.shift();
    order.push(curr);

    for (const neighbor of adjacency[curr]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== nodes.length) {
    throw new Error('Graph contains cycles. Execution is only supported on Directed Acyclic Graphs (DAG).');
  }

  return order;
};

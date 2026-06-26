// engine/executors/databaseExecutor.js

// Shared in-memory mock database
const simulatedDb = {};

export const executeDatabaseNode = async (node, inputs, context) => {
  const tableName = node.data?.tableName || 'default_table';
  const operation = node.data?.operation || 'Select';
  const inputVal = Object.values(inputs)[0] || '';
  
  if (!simulatedDb[tableName]) {
    simulatedDb[tableName] = new Map();
  }
  
  const table = simulatedDb[tableName];
  let result = null;
  let log = '';
  
  switch (operation) {
    case 'Insert':
      let insertObj;
      try {
        insertObj = typeof inputVal === 'string' ? JSON.parse(inputVal) : inputVal;
        if (typeof insertObj !== 'object' || insertObj === null) {
          insertObj = { value: inputVal };
        }
      } catch (e) {
        insertObj = { value: inputVal };
      }
      
      const newId = `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const newRecord = { id: newId, ...insertObj, createdAt: new Date().toISOString() };
      table.set(newId, newRecord);
      
      result = newRecord;
      log = `Inserted into ${tableName}. Rows affected: 1. Stored ID: ${newId}.`;
      break;
      
    case 'Select':
      // Return all elements in simulated table
      const records = Array.from(table.values());
      result = records;
      log = `Selected ${records.length} records from ${tableName}.`;
      break;
      
    case 'Update':
      let updateObj;
      try {
        updateObj = typeof inputVal === 'string' ? JSON.parse(inputVal) : inputVal;
      } catch (e) {
        throw new Error(`Database Update operation in node '${node.id}' expects a JSON object containing target fields.`);
      }
      
      if (table.size === 0) {
        log = `Updated table ${tableName}. Rows affected: 0 (Table is empty).`;
        result = { rowsAffected: 0 };
      } else {
        // Mock updating the first entry
        const [firstId, firstRecord] = table.entries().next().value;
        const updatedRecord = { ...firstRecord, ...updateObj, updatedAt: new Date().toISOString() };
        table.set(firstId, updatedRecord);
        
        result = updatedRecord;
        log = `Updated table ${tableName}. Rows affected: 1. Updated ID: ${firstId}.`;
      }
      break;
      
    case 'Delete':
      if (table.size === 0) {
        log = `Deleted from ${tableName}. Rows affected: 0.`;
        result = { rowsAffected: 0 };
      } else {
        // Delete the first entry
        const [firstId] = table.entries().next().value;
        table.delete(firstId);
        log = `Deleted from ${tableName}. Rows affected: 1. Deleted ID: ${firstId}.`;
        result = { deletedId: firstId, rowsAffected: 1 };
      }
      break;
      
    default:
      throw new Error(`Unsupported database operation: ${operation}`);
  }
  
  // Save to context
  const contextKey = `db_${tableName}_last_result`;
  context[contextKey] = result;

  return {
    value: result,
    log,
    dbStat: {
      operation,
      tableName,
      rowCount: 1
    },
    contextUpdate: { [contextKey]: result }
  };
};

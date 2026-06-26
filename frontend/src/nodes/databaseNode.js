import { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { BaseNode, StyledLabel, StyledInput, StyledSelect } from './BaseNode';
import { useStore } from '../store';

export const DatabaseNode = ({ id, data, selected }) => {
  const [tableName, setTableName] = useState(data?.tableName || '');
  const [operation, setOperation] = useState(data?.operation || 'Select');
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Sync state to Zustand store on initial load
  useEffect(() => {
    if (data?.tableName === undefined) {
      updateNodeField(id, 'tableName', tableName);
    }
    if (data?.operation === undefined) {
      updateNodeField(id, 'operation', operation);
    }
  }, [id, data?.tableName, data?.operation, tableName, operation, updateNodeField]);

  const handleTableNameChange = (e) => {
    const value = e.target.value;
    setTableName(value);
    updateNodeField(id, 'tableName', value);
  };

  const handleOperationChange = (e) => {
    const value = e.target.value;
    setOperation(value);
    updateNodeField(id, 'operation', value);
  };

  return (
    <BaseNode
      title="Database"
      selected={selected}
      executionStatus={data?.executionStatus}
      handles={[
        { type: 'target', position: Position.Left, id: `${id}-input` },
        { type: 'source', position: Position.Right, id: `${id}-output` },
      ]}
    >
      <StyledLabel>
        Table Name:
        <StyledInput
          type="text"
          value={tableName}
          onChange={handleTableNameChange}
          placeholder="users"
        />
      </StyledLabel>
      <StyledLabel>
        Operation:
        <StyledSelect value={operation} onChange={handleOperationChange}>
          <option value="Select">Select</option>
          <option value="Insert">Insert</option>
          <option value="Update">Update</option>
          <option value="Delete">Delete</option>
        </StyledSelect>
      </StyledLabel>
    </BaseNode>
  );
};

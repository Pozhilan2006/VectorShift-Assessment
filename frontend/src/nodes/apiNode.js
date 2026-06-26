import { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { BaseNode, StyledLabel, StyledInput, StyledSelect } from './BaseNode';
import { useStore } from '../store';

export const ApiNode = ({ id, data, selected }) => {
  const [url, setUrl] = useState(data?.url || '');
  const [method, setMethod] = useState(data?.method || 'GET');
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Sync state to Zustand store on initial load
  useEffect(() => {
    if (data?.url === undefined) {
      updateNodeField(id, 'url', url);
    }
    if (data?.method === undefined) {
      updateNodeField(id, 'method', method);
    }
  }, [id, data?.url, data?.method, url, method, updateNodeField]);

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    updateNodeField(id, 'url', value);
  };

  const handleMethodChange = (e) => {
    const value = e.target.value;
    setMethod(value);
    updateNodeField(id, 'method', value);
  };

  return (
    <BaseNode
      title="API"
      selected={selected}
      executionStatus={data?.executionStatus}
      handles={[
        { type: 'target', position: Position.Left, id: `${id}-input` },
        { type: 'source', position: Position.Right, id: `${id}-output` },
      ]}
    >
      <StyledLabel>
        URL:
        <StyledInput
          type="text"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://api.example.com"
        />
      </StyledLabel>
      <StyledLabel>
        Method:
        <StyledSelect value={method} onChange={handleMethodChange}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </StyledSelect>
      </StyledLabel>
    </BaseNode>
  );
};

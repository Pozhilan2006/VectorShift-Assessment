import { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { BaseNode, StyledLabel, StyledInput, StyledSelect } from './BaseNode';
import { useStore } from '../store';

export const OutputNode = ({ id, data, selected }) => {
  const [currName, setCurrName] = useState(data?.outputName || id.replace('customOutput-', 'output_'));
  const [outputType, setOutputType] = useState(data?.outputType || 'Text');
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Sync state to Zustand store on initial load
  useEffect(() => {
    if (data?.outputName === undefined) {
      updateNodeField(id, 'outputName', currName);
    }
    if (data?.outputType === undefined) {
      updateNodeField(id, 'outputType', outputType);
    }
  }, [id, data?.outputName, data?.outputType, currName, outputType, updateNodeField]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setCurrName(value);
    updateNodeField(id, 'outputName', value);
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setOutputType(value);
    updateNodeField(id, 'outputType', value);
  };

  return (
    <BaseNode
      title="Output"
      selected={selected}
      executionStatus={data?.executionStatus}
      handles={[
        { type: 'target', position: Position.Left, id: `${id}-value` },
      ]}
    >
      <StyledLabel>
        Name:
        <StyledInput
          type="text"
          value={currName}
          onChange={handleNameChange}
        />
      </StyledLabel>
      <StyledLabel>
        Type:
        <StyledSelect value={outputType} onChange={handleTypeChange}>
          <option value="Text">Text</option>
          <option value="File">Image</option>
        </StyledSelect>
      </StyledLabel>
    </BaseNode>
  );
};

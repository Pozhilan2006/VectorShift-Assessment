import { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { BaseNode, StyledLabel, StyledInput, StyledSelect } from './BaseNode';
import { useStore } from '../store';

export const InputNode = ({ id, data, selected }) => {
  const [currName, setCurrName] = useState(data?.inputName || id.replace('customInput-', 'input_'));
  const [inputType, setInputType] = useState(data?.inputType || 'Text');
  const [sampleValue, setSampleValue] = useState(data?.sampleValue || '');
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Sync state to Zustand store on initial load
  useEffect(() => {
    if (data?.inputName === undefined) {
      updateNodeField(id, 'inputName', currName);
    }
    if (data?.inputType === undefined) {
      updateNodeField(id, 'inputType', inputType);
    }
    if (data?.sampleValue === undefined) {
      updateNodeField(id, 'sampleValue', sampleValue);
    }
  }, [id, data?.inputName, data?.inputType, data?.sampleValue, currName, inputType, sampleValue, updateNodeField]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setCurrName(value);
    updateNodeField(id, 'inputName', value);
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setInputType(value);
    updateNodeField(id, 'inputType', value);
  };

  const handleSampleValueChange = (e) => {
    const value = e.target.value;
    setSampleValue(value);
    updateNodeField(id, 'sampleValue', value);
  };

  return (
    <BaseNode
      title="Input"
      selected={selected}
      executionStatus={data?.executionStatus}
      handles={[
        { type: 'source', position: Position.Right, id: `${id}-value` },
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
        <StyledSelect value={inputType} onChange={handleTypeChange}>
          <option value="Text">Text</option>
          <option value="File">File</option>
        </StyledSelect>
      </StyledLabel>
      <StyledLabel>
        Sample Value:
        <StyledInput
          type="text"
          value={sampleValue}
          onChange={handleSampleValueChange}
          placeholder="e.g. hello world"
        />
      </StyledLabel>
    </BaseNode>
  );
};

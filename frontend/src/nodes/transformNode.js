import { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { BaseNode, StyledLabel, StyledSelect } from './BaseNode';
import { useStore } from '../store';

export const TransformNode = ({ id, data, selected }) => {
  const [transformType, setTransformType] = useState(data?.transformType || 'Uppercase');
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Sync state to Zustand store on initial load
  useEffect(() => {
    if (data?.transformType === undefined) {
      updateNodeField(id, 'transformType', transformType);
    }
  }, [id, data?.transformType, transformType, updateNodeField]);

  const handleTransformTypeChange = (e) => {
    const value = e.target.value;
    setTransformType(value);
    updateNodeField(id, 'transformType', value);
  };

  return (
    <BaseNode
      title="Transform"
      selected={selected}
      executionStatus={data?.executionStatus}
      handles={[
        { type: 'target', position: Position.Left, id: `${id}-input` },
        { type: 'source', position: Position.Right, id: `${id}-output` },
      ]}
    >
      <StyledLabel>
        Transformation Type:
        <StyledSelect value={transformType} onChange={handleTransformTypeChange}>
          <option value="Uppercase">Uppercase</option>
          <option value="Lowercase">Lowercase</option>
          <option value="Trim">Trim</option>
          <option value="Reverse">Reverse</option>
          <option value="Capitalize">Capitalize</option>
          <option value="JSON Pretty Print">JSON Pretty Print</option>
          <option value="Remove Extra Spaces">Remove Extra Spaces</option>
        </StyledSelect>
      </StyledLabel>
    </BaseNode>
  );
};

import { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { BaseNode, StyledLabel, StyledInput } from './BaseNode';
import { useStore } from '../store';

export const ConditionNode = ({ id, data, selected }) => {
  const [conditionName, setConditionName] = useState(data?.conditionName || '');
  const [expression, setExpression] = useState(data?.expression || '');
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Sync state to Zustand store on initial load
  useEffect(() => {
    if (data?.conditionName === undefined) {
      updateNodeField(id, 'conditionName', conditionName);
    }
    if (data?.expression === undefined) {
      updateNodeField(id, 'expression', expression);
    }
  }, [id, data?.conditionName, data?.expression, conditionName, expression, updateNodeField]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setConditionName(value);
    updateNodeField(id, 'conditionName', value);
  };

  const handleExpressionChange = (e) => {
    const value = e.target.value;
    setExpression(value);
    updateNodeField(id, 'expression', value);
  };

  return (
    <BaseNode
      title="Condition"
      selected={selected}
      minHeight={100}
      handles={[
        { type: 'target', position: Position.Left, id: `${id}-input` },
        { type: 'source', position: Position.Right, id: `${id}-true`, style: { top: `${100 / 3}%` } },
        { type: 'source', position: Position.Right, id: `${id}-false`, style: { top: `${200 / 3}%` } },
      ]}
    >
      <StyledLabel>
        Condition Name:
        <StyledInput
          type="text"
          value={conditionName}
          onChange={handleNameChange}
          placeholder="e.g. Is Valid Email"
        />
      </StyledLabel>
      <StyledLabel>
        Expression:
        <StyledInput
          type="text"
          value={expression}
          onChange={handleExpressionChange}
          placeholder="e.g. x === 10"
        />
      </StyledLabel>
    </BaseNode>
  );
};

import { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { BaseNode, StyledLabel, StyledInput, StyledTextarea } from './BaseNode';
import { useStore } from '../store';

export const PromptNode = ({ id, data, selected }) => {
  const [template, setTemplate] = useState(data?.template || '');
  const [temperature, setTemperature] = useState(data?.temperature ?? 0.7);
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Sync state to Zustand store on initial load
  useEffect(() => {
    if (data?.template === undefined) {
      updateNodeField(id, 'template', template);
    }
    if (data?.temperature === undefined) {
      updateNodeField(id, 'temperature', temperature);
    }
  }, [id, data?.template, data?.temperature, template, temperature, updateNodeField]);

  const handleTemplateChange = (e) => {
    const value = e.target.value;
    setTemplate(value);
    updateNodeField(id, 'template', value);
  };

  const handleTemperatureChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setTemplate(value);
    updateNodeField(id, 'temperature', value);
  };

  return (
    <BaseNode
      title="Prompt"
      selected={selected}
      handles={[
        { type: 'target', position: Position.Left, id: `${id}-input` },
        { type: 'source', position: Position.Right, id: `${id}-output` },
      ]}
    >
      <StyledLabel>
        Template:
        <StyledTextarea
          value={template}
          onChange={handleTemplateChange}
          placeholder="You are a helpful assistant..."
        />
      </StyledLabel>
      <StyledLabel>
        Temperature:
        <StyledInput
          type="number"
          step="0.1"
          value={temperature}
          onChange={handleTemperatureChange}
        />
      </StyledLabel>
    </BaseNode>
  );
};

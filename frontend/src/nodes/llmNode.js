import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';

export const LLMNode = ({ id, selected }) => {
  return (
    <BaseNode
      title="LLM"
      selected={selected}
      minHeight={100}
      handles={[
        { type: 'target', position: Position.Left, id: `${id}-system`, style: { top: `${100 / 3}%` } },
        { type: 'target', position: Position.Left, id: `${id}-prompt`, style: { top: `${200 / 3}%` } },
        { type: 'source', position: Position.Right, id: `${id}-response` },
      ]}
    >
      <div style={{ color: '#64748B', fontSize: '13px' }}>
        This is a LLM.
      </div>
    </BaseNode>
  );
};

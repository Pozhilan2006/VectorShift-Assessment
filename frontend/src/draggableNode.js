import React, { useState } from 'react';
import { useStore } from './store';

const nodeIcons = {
  customInput: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  ),
  customOutput: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  llm: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"></rect>
      <circle cx="12" cy="5" r="2"></circle>
      <path d="M12 7v4"></path>
      <line x1="8" y1="16" x2="8.01" y2="16"></line>
      <line x1="16" y1="16" x2="16.01" y2="16"></line>
    </svg>
  ),
  text: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  prompt: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  condition: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  api: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
  transform: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  database: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
    </svg>
  )
};

// Colors map for each node type (as defined in Phase 6 requirements)
const accentColors = {
  customInput: {
    color: '#22c55e', // green
    hoverBg: 'rgba(34, 197, 94, 0.08)',
    glow: 'rgba(34, 197, 94, 0.15)',
  },
  customOutput: {
    color: '#f97316', // orange
    hoverBg: 'rgba(249, 115, 22, 0.08)',
    glow: 'rgba(249, 115, 22, 0.15)',
  },
  llm: {
    color: '#a855f7', // purple
    hoverBg: 'rgba(168, 85, 247, 0.08)',
    glow: 'rgba(168, 85, 247, 0.15)',
  },
  text: {
    color: '#6366f1', // default indigo/blue
    hoverBg: 'rgba(99, 102, 241, 0.08)',
    glow: 'rgba(99, 102, 241, 0.15)',
  },
  prompt: {
    color: '#ec4899', // pink
    hoverBg: 'rgba(236, 72, 153, 0.08)',
    glow: 'rgba(236, 72, 153, 0.15)',
  },
  condition: {
    color: '#eab308', // yellow
    hoverBg: 'rgba(234, 179, 8, 0.08)',
    glow: 'rgba(234, 179, 8, 0.15)',
  },
  api: {
    color: '#3b82f6', // blue
    hoverBg: 'rgba(59, 130, 246, 0.08)',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  transform: {
    color: '#06b6d4', // cyan
    hoverBg: 'rgba(6, 182, 212, 0.08)',
    glow: 'rgba(6, 182, 212, 0.15)',
  },
  database: {
    color: '#64748b', // gray
    hoverBg: 'rgba(100, 116, 139, 0.08)',
    glow: 'rgba(100, 116, 139, 0.15)',
  },
};

export const DraggableNode = ({ type, label }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExecuting = useStore((state) => state.isExecuting);
  
  const accent = accentColors[type] || { color: '#3b82f6', hoverBg: 'rgba(59, 130, 246, 0.08)', glow: 'rgba(59, 130, 246, 0.15)' };

  const onDragStart = (event, nodeType) => {
    if (isExecuting) return;
    const appData = { nodeType };
    event.target.style.cursor = 'grabbing';
    event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`${type} tactile-btn`}
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={(event) => (event.target.style.cursor = isExecuting ? 'not-allowed' : 'grab')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={isExecuting ? -1 : 0}
      role="button"
      aria-label={`Drag to add ${label} node`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
        }
      }}
      style={{
        cursor: isExecuting ? 'not-allowed' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '8px 14px',
        height: '38px',
        borderRadius: '8px',
        background: isExecuting ? 'var(--bg-inputs)' : (isHovered ? 'var(--bg-inputs-hover)' : 'var(--bg-cards)'),
        border: isExecuting ? '1px solid var(--border-color)' : (isHovered ? '1px solid var(--text-muted)' : '1px solid var(--border-color)'),
        color: 'var(--text-primary)',
        opacity: isExecuting ? 0.6 : 1,
        boxShadow: !isExecuting && isHovered
          ? '0 2px 6px var(--shadow-hover)'
          : '0 1px 2px var(--shadow-color)',
        transform: !isExecuting && isHovered ? 'translateY(-1px)' : 'none',
        transition: 'all 150ms ease',
        fontFamily: 'inherit',
        fontSize: '13px',
        fontWeight: '500',
        userSelect: 'none',
        boxSizing: 'border-box',
        outline: 'none',
      }}
      draggable={!isExecuting}
    >
      <span style={{ 
        display: 'flex', 
        alignItems: 'center',
        color: isExecuting ? 'var(--border-color)' : (isHovered ? accent.color : 'var(--text-secondary)'),
        transition: 'color 150ms ease'
      }}>
        {nodeIcons[type] || null}
      </span>
      <span>{label}</span>
    </div>
  );
};
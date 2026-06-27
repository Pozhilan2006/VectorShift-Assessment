import React, { useState, forwardRef } from 'react';
import { Handle } from 'reactflow';

// Inject global stylesheet for form controls, active states, handles, and accessibility outlines
const globalStyleSheet = `
  .node-control {
    transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
  }
  .node-control:hover {
    border-color: var(--color-primary) !important;
    background-color: var(--bg-inputs-hover) !important;
  }
  .node-control:focus {
    border-color: var(--color-primary) !important;
    background-color: var(--bg-inputs-hover) !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25) !important;
  }
  .tactile-btn {
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tactile-btn:active {
    transform: scale(0.96) !important;
  }
  .tactile-btn:focus-visible {
    outline: 2px solid var(--color-primary) !important;
    outline-offset: 2px;
  }
  .react-flow__handle {
    transition: all 150ms ease !important;
  }
  .react-flow__handle:active {
    background: var(--color-primary-hover) !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3), 0 1px 2px var(--shadow-color) !important;
  }
  
  /* Keyboard selection focus borders for ReactFlow nodes */
  .react-flow__node:focus-visible {
    outline: none !important;
  }
  .react-flow__node:focus-visible > div {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3), 0 4px 12px var(--shadow-color) !important;
    border-color: var(--color-primary) !important;
  }
`;

// Shared form control styles for our UI
const formControlStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: '13px',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-inputs)',
  boxSizing: 'border-box',
  outline: 'none',
};

// Reusable styled elements exported for individual nodes
export const StyledInput = forwardRef((props, ref) => (
  <input
    ref={ref}
    className="nodrag node-control"
    {...props}
    style={{ ...formControlStyle, ...props.style }}
  />
));

export const StyledTextarea = forwardRef((props, ref) => (
  <textarea
    ref={ref}
    className="nodrag node-control"
    {...props}
    style={{
      ...formControlStyle,
      resize: 'vertical',
      minHeight: '72px',
      ...props.style,
    }}
  />
));

export const StyledSelect = forwardRef((props, ref) => (
  <select
    ref={ref}
    className="nodrag node-control"
    {...props}
    style={{
      ...formControlStyle,
      appearance: 'auto',
      cursor: 'pointer',
      ...props.style,
    }}
  />
));

export const StyledLabel = ({ children, style }) => (
  <label style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    ...style,
  }}>
    {children}
  </label>
);

const HoverableHandle = ({ id, style, ...handleProps }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Handle
      id={id}
      {...handleProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '10px',
        height: '10px',
        background: isHovered ? 'var(--color-primary-hover)' : 'var(--color-primary)',
        border: '2px solid var(--bg-cards-opaque)',
        boxShadow: isHovered
          ? '0 0 0 3px rgba(37, 99, 235, 0.3), 0 1px 2px var(--shadow-color)'
          : '0 1px 2px var(--shadow-color)',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        zIndex: 20,
        ...style, // preserve specific top/left positions injected by nodes
      }}
    />
  );
};

export const BaseNode = ({
  title,
  children,
  handles = [],
  width = 240,
  minHeight = 80,
  selected = false,
  executionStatus = undefined,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  let borderStyle = selected 
    ? '1.5px solid var(--color-primary)' 
    : (isHovered ? '1px solid var(--text-muted)' : '1px solid var(--border-color)');
    
  let shadowStyle = selected
    ? '0 4px 12px var(--shadow-hover)'
    : (isHovered 
      ? '0 3px 8px var(--shadow-hover)' 
      : '0 1px 4px var(--shadow-color)');

  let backgroundStyle = isHovered ? 'var(--bg-cards-hover)' : 'var(--bg-cards)';

  if (executionStatus === 'running') {
    borderStyle = '2px solid var(--color-primary)';
    shadowStyle = '0 4px 12px rgba(37, 99, 235, 0.2)';
    backgroundStyle = 'var(--bg-cards-hover)';
  } else if (executionStatus === 'completed') {
    borderStyle = '2px solid var(--color-success)';
    shadowStyle = '0 4px 12px rgba(34, 197, 94, 0.2)';
    backgroundStyle = 'var(--bg-cards-hover)';
  } else if (executionStatus === 'failed') {
    borderStyle = '2px solid var(--color-error)';
    shadowStyle = '0 4px 12px rgba(239, 68, 68, 0.2)';
    backgroundStyle = 'var(--bg-cards-hover)';
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label={`${title || 'Workflow'} Node`}
      style={{
        background: backgroundStyle,
        border: borderStyle,
        borderRadius: '12px',
        boxShadow: shadowStyle,
        transform: 'none',
        transition: 'all 150ms ease',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        fontSize: '13px',
        color: 'var(--text-primary)',
        lineHeight: 1.4,
        width,
        minHeight,
      }}
    >
      <style>{globalStyleSheet}</style>

      {handles.map(({ id, style, label, ...handleProps }) => (
        <React.Fragment key={id}>
          <HoverableHandle
            id={id}
            style={style}
            {...handleProps}
          />
          {label && (
            <div
              style={{
                position: 'absolute',
                top: style?.top || '50%',
                transform: 'translateY(-50%)',
                left: handleProps.position === 'left' ? 'auto' : '100%',
                right: handleProps.position === 'left' ? '100%' : 'auto',
                marginLeft: handleProps.position === 'right' ? '8px' : '0',
                marginRight: handleProps.position === 'left' ? '8px' : '0',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                backgroundColor: 'var(--bg-cards)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '2px 6px',
                boxShadow: '0 2px 4px var(--shadow-color)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 10,
              }}
            >
              {label}
            </div>
          )}
        </React.Fragment>
      ))}

      {title && (
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-color-subtle)',
        }}>
          {title}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {children}
      </div>
    </div>
  );
};

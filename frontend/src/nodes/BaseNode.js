import React, { useState, forwardRef } from 'react';
import { Handle } from 'reactflow';

// Inject global stylesheet for form controls, active states, handles, and accessibility outlines
const globalStyleSheet = `
  .node-control {
    transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
  }
  .node-control:hover {
    border-color: #94A3B8 !important;
    background-color: #ffffff !important;
  }
  .node-control:focus {
    border-color: #2563EB !important;
    background-color: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25) !important;
  }
  .tactile-btn {
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tactile-btn:active {
    transform: scale(0.96) !important;
  }
  .tactile-btn:focus-visible {
    outline: 2px solid #2563EB !important;
    outline-offset: 2px;
  }
  .react-flow__handle {
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  .react-flow__handle:active {
    background: #1D4ED8 !important;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4), 0 0 12px rgba(37, 99, 235, 0.9), 0 2px 4px rgba(15, 23, 42, 0.15) !important;
  }
  
  /* Keyboard selection focus borders for ReactFlow nodes */
  .react-flow__node:focus-visible {
    outline: none !important;
  }
  .react-flow__node:focus-visible > div {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.45), 0 16px 40px rgba(15, 23, 42, 0.16) !important;
    border-color: #2563EB !important;
  }
`;

// Shared form control styles for our glassmorphism UI
const formControlStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontSize: '13px',
  color: '#1e293b',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  boxSizing: 'border-box',
  outline: 'none',
};

// Reusable styled elements exported for individual nodes
export const StyledInput = forwardRef((props, ref) => (
  <input
    ref={ref}
    className="node-control"
    {...props}
    style={{ ...formControlStyle, ...props.style }}
  />
));

export const StyledTextarea = forwardRef((props, ref) => (
  <textarea
    ref={ref}
    className="node-control"
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
    className="node-control"
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
    color: '#64748B',
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
        width: '12px',
        height: '12px',
        background: isHovered ? '#1D4ED8' : '#2563EB',
        border: '2px solid #ffffff',
        boxShadow: isHovered
          ? '0 0 0 3px rgba(37, 99, 235, 0.35), 0 0 8px rgba(37, 99, 235, 0.8), 0 2px 4px rgba(15, 23, 42, 0.15)'
          : '0 2px 4px rgba(15, 23, 42, 0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
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
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label={`${title || 'Workflow'} Node`}
      style={{
        background: isHovered ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.75)',
        border: selected 
          ? '1.5px solid #2563EB' 
          : (isHovered ? '1px solid #94A3B8' : '1px solid #CBD5E1'),
        borderRadius: '14px',
        boxShadow: selected
          ? '0 0 0 3px rgba(37, 99, 235, 0.25), 0 16px 40px rgba(15, 23, 42, 0.16)'
          : (isHovered 
            ? '0 16px 40px rgba(15, 23, 42, 0.16)' 
            : '0 12px 30px rgba(15, 23, 42, 0.12)'),
        transform: isHovered ? 'translateY(-2px)' : 'none',
        transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Safari support
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        fontSize: '13px',
        color: '#1e293b',
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
                color: '#64748B',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #CBD5E1',
                borderRadius: '4px',
                padding: '2px 6px',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.05)',
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
          color: '#64748B',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(203, 213, 225, 0.5)',
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

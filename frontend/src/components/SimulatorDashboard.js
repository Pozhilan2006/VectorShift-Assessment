// components/SimulatorDashboard.js

import { useState } from 'react';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

export const SimulatorDashboard = () => {
  const {
    isExecuting,
    executionStatus,
    executionLogs,
    executionContext,
    executionStats,
    resetExecutionState,
  } = useStore(
    (state) => ({
      isExecuting: state.isExecuting,
      executionStatus: state.executionStatus,
      executionLogs: state.executionLogs,
      executionContext: state.executionContext,
      executionStats: state.executionStats,
      resetExecutionState: state.resetExecutionState,
    }),
    shallow
  );

  const [isExpanded, setIsExpanded] = useState(true);

  if (executionStatus === 'idle') {
    return null; // Don't take up space when simulator hasn't been run
  }

  const statusColors = {
    running: { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', label: 'Executing Simulation...' },
    completed: { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', label: 'Simulation Finished' },
    failed: { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626', label: 'Simulation Failed' },
  };

  const status = statusColors[executionStatus] || { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', label: 'Simulator Ready' };

  return (
    <div
      style={{
        margin: '0 24px 24px 24px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        fontFamily: 'inherit',
        overflow: 'hidden',
        transition: 'all 250ms ease',
      }}
    >
      {/* Dashboard Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          background: 'rgba(248, 250, 252, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: status.bg,
              border: `1px solid ${status.border}`,
              color: status.text,
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: status.text,
                display: 'inline-block',
                animation: executionStatus === 'running' ? 'pulse-anim 1s infinite alternate' : 'none',
              }}
            />
            {status.label}
          </div>
          <style>{`
            @keyframes pulse-anim {
              from { opacity: 0.3; transform: scale(0.8); }
              to { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={resetExecutionState}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <polyline points="3 3 3 8 8 8"></polyline>
            </svg>
            Reset Simulator
          </button>
          
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 200ms ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Dashboard Content */}
      {isExpanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(280px, 1fr)',
            maxHeight: '280px',
            boxSizing: 'border-box',
          }}
        >
          {/* Logs Area */}
          <div
            style={{
              padding: '16px 20px',
              borderRight: '1px solid rgba(226, 232, 240, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
              }}
            >
              Execution Logs
            </div>
            <div
              className="custom-scroll-area"
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '6px',
              }}
            >
              {executionLogs.map((log, idx) => {
                let icon = '●';
                let color = '#3B82F6';
                if (log.type === 'success') {
                  icon = '✓';
                  color = '#10B981';
                } else if (log.type === 'error') {
                  icon = '✗';
                  color = '#EF4444';
                }
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#334155',
                      lineHeight: '1.4',
                    }}
                  >
                    <span style={{ color, fontWeight: 'bold', flexShrink: 0 }}>{icon}</span>
                    <span>{log.message}</span>
                  </div>
                );
              })}
              {isExecuting && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
                  <span className="sim-spinner" />
                  Running simulator steps...
                  <style>{`
                    .sim-spinner {
                      width: 10px;
                      height: 10px;
                      border: 1.5px solid rgba(100, 116, 139, 0.2);
                      border-top-color: #64748B;
                      border-radius: 50%;
                      animation: sim-spin 0.8s linear infinite;
                    }
                    @keyframes sim-spin { to { transform: rotate(360deg); } }
                  `}</style>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Context and Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: '1fr auto',
              overflow: 'hidden',
            }}
          >
            {/* Live Context Variables */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '10px',
                }}
              >
                Live Execution Context
              </div>
              <div
                className="custom-scroll-area"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: '6px',
                }}
              >
                {Object.keys(executionContext).length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', padding: '10px 0' }}>
                    No execution variables populated yet.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <tbody>
                      {Object.entries(executionContext).map(([key, val]) => {
                        const valStr = typeof val === 'object' && val !== null
                          ? JSON.stringify(val)
                          : String(val);
                        return (
                          <tr key={key} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 0', fontWeight: 600, color: '#475569', verticalAlign: 'top', width: '35%' }}>
                              {key}
                            </td>
                            <td
                              style={{
                                padding: '6px 0 6px 12px',
                                color: '#0F172A',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                                whiteSpace: 'pre-wrap',
                                verticalAlign: 'top',
                              }}
                            >
                              {valStr.length > 150 ? `${valStr.substring(0, 150)}...` : valStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Run Statistics Block */}
            {executionStats && (
              <div
                style={{
                  padding: '14px 20px',
                  background: 'rgba(248, 250, 252, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Simulation Statistics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>Time Elapsed</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{executionStats.duration} ms</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>Nodes Executed</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{executionStats.nodeCount}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>API Queries</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{executionStats.apiCallsCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

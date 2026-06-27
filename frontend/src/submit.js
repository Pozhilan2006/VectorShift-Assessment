// submit.js

import { useState } from 'react';
import axios from 'axios';
import { shallow } from 'zustand/shallow';
import { useStore } from './store';
import { runPipelineSimulation } from './engine/executor';

const API_URL = 'http://localhost:8000/pipelines/parse';

const modalStyles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleUp {
  from {
    transform: scale(0.95) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive padding & container adjustments */
.responsive-modal-container {
  padding: 24px;
}
.responsive-modal-inner {
  gap: 18px;
}
.responsive-summary-grid {
  gap: 6px;
}

@media (max-height: 850px), (max-width: 1024px) {
  .responsive-modal-container {
    padding: 16px;
  }
  .responsive-modal-inner {
    gap: 12px;
  }
}

@media (max-height: 680px), (max-width: 640px) {
  .responsive-modal-container {
    padding: 12px;
  }
  .responsive-modal-inner {
    gap: 10px;
  }
}

/* Scrollbar styling */
.custom-scroll-area::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll-area::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.custom-scroll-area::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`;

const Spinner = () => (
  <svg 
    style={{ 
      animation: 'spin 1s linear infinite', 
      marginRight: '8px',
      display: 'inline-block',
      verticalAlign: 'middle'
    }} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SummaryCard = ({ label, value, accent }) => (
  <div style={{
    background: 'var(--bg-inputs)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '6px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    boxSizing: 'border-box',
    height: '32px'
  }}>
    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    <span style={{ color: accent || 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
  </div>
);

const StatusItem = ({ label, isValid, isWarning }) => {
  let icon = '✓';
  let color = 'var(--color-success)';
  if (isWarning) {
    icon = '⚠';
    color = 'var(--color-warning)';
  } else if (!isValid) {
    icon = '✗';
    color = 'var(--color-error)';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)' }}>
      <span style={{ color, fontWeight: 'bold', fontSize: '13px' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

const ResultModal = ({ result, error, onClose }) => {
  const theme = useStore((state) => state.theme);
  const summary = result?.summary || {};
  const checks = result?.checks || [];

  const warnings = checks.filter(c => c.type === 'warning' || c.severity === 'warning');
  
  const hasFieldsError = checks.some(c => (c.type === 'error' || c.severity === 'error') && c.message.includes('missing'));
  const hasVariablesError = checks.some(c => (c.type === 'error' || c.severity === 'error') && (c.message.includes('variable') || c.message.includes('Variable')));

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--modal-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 150ms ease-out forwards',
        boxSizing: 'border-box'
      }} 
      onClick={onClose} 
      role="presentation"
    >
      <style>{modalStyles}</style>
      <div
        className="responsive-modal-container"
        style={{
          background: 'var(--bg-panels-opaque)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 12px 30px var(--shadow-color)',
          width: 'min(720px, 92vw)',
          maxHeight: '90vh',
          boxSizing: 'border-box',
          animation: 'scaleUp 150ms ease-out forwards',
          fontFamily: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pipeline-result-title"
      >
        {/* Header (Fixed) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '12px',
          flexShrink: 0
        }}>
          {!error ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: summary.ready 
                ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4')
                : (theme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2'),
              border: summary.ready 
                ? (theme === 'dark' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #bbf7d0')
                : (theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca'),
              color: summary.ready 
                ? (theme === 'dark' ? '#4ade80' : '#16a34a')
                : (theme === 'dark' ? '#f87171' : '#dc2626'),
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {summary.ready ? (
                  <polyline points="20 6 9 17 4 12"></polyline>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </>
                )}
              </svg>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
              border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca',
              color: theme === 'dark' ? '#f87171' : '#dc2626',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          )}
          <h2 
            id="pipeline-result-title" 
            style={{
              margin: '0',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {error ? 'Submission Failed' : 'Pipeline Validation Engine'}
          </h2>
        </div>

        {/* Content Body */}
        {error ? (
          <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
            <p 
              style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: 1.5,
                color: theme === 'dark' ? '#f87171' : '#b91c1c',
                backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fff5f5',
                border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              {error}
            </p>
          </div>
        ) : result ? (
          <div 
            className="responsive-modal-inner"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1, 
              overflow: 'hidden',
              marginTop: '12px'
            }}
          >
            
            {/* Summary Grid (Fixed) */}
            <div style={{ flexShrink: 0 }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>Pipeline Summary</h3>
              <div 
                className="responsive-summary-grid"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '6px 12px'
                }}
              >
                <SummaryCard label="Nodes" value={summary.nodes} />
                <SummaryCard label="Edges" value={summary.edges} />
                <SummaryCard label="Connections" value={summary.connections} />
                <SummaryCard label="Variables" value={summary.variables} />
                <SummaryCard label="Inputs" value={summary.inputs} />
                <SummaryCard label="Outputs" value={summary.outputs} />
                <SummaryCard 
                  label="Topology" 
                  value={summary.is_dag ? 'DAG' : 'Cyclic'} 
                  accent={summary.is_dag ? 'var(--color-success)' : 'var(--color-error)'} 
                />
                <SummaryCard 
                  label="Isolated Nodes" 
                  value={summary.isolated_nodes} 
                  accent={summary.isolated_nodes > 0 ? 'var(--color-warning)' : 'var(--text-secondary)'} 
                />
              </div>
            </div>

            {/* Core Validation Checklist (Fixed) */}
            <div style={{ flexShrink: 0 }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>Validation Checklist</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '6px 12px', 
                padding: '10px 14px', 
                background: 'var(--bg-inputs)', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)' 
              }}>
                <StatusItem label="Input node found" isValid={summary.inputs > 0} />
                <StatusItem label="Output node found" isValid={summary.outputs > 0} />
                <StatusItem label="Variables valid" isValid={!hasVariablesError} />
                <StatusItem label="Required fields" isValid={!hasFieldsError} />
                <StatusItem label="Warnings" isValid={true} isWarning={warnings.length > 0} />
                <StatusItem label="DAG" isValid={summary.is_dag} />
              </div>
            </div>

            {/* Detailed Checks Panel (Scrollable Area) */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1, 
              overflow: 'hidden', 
              minHeight: '80px'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px 0', flexShrink: 0 }}>Detailed Logs</h3>
              <div 
                className="custom-scroll-area"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '5px', 
                  overflowY: 'auto', 
                  paddingRight: '6px',
                  flex: 1
                }}
              >
                {checks.map((check, idx) => {
                  const isErr = check.type === 'error' || check.severity === 'error';
                  const isWarn = check.type === 'warning' || check.severity === 'warning';
                  
                  let bgColor = theme === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4';
                  let borderColor = theme === 'dark' ? 'rgba(34, 197, 94, 0.3)' : '#bbf7d0';
                  let textColor = theme === 'dark' ? '#4ade80' : '#15803d';
                  let prefix = '✅';

                  if (isErr) {
                    bgColor = theme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fff5f5';
                    borderColor = theme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca';
                    textColor = theme === 'dark' ? '#f87171' : '#b91c1c';
                    prefix = '❌';
                  } else if (isWarn) {
                    bgColor = theme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb';
                    borderColor = theme === 'dark' ? 'rgba(245, 158, 11, 0.3)' : '#fde68a';
                    textColor = theme === 'dark' ? '#fbbf24' : '#b45309';
                    prefix = '⚠';
                  }

                  return (
                    <div 
                      key={idx}
                      style={{
                        backgroundColor: bgColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                        padding: '6px 10px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minHeight: '30px',
                        boxSizing: 'border-box',
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontSize: '12px', flexShrink: 0 }}>{prefix}</span>
                      <span style={{ wordBreak: 'break-word', lineHeight: '1.3' }}>
                        {check.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : null}

        {/* Footer (Fixed) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          marginTop: '12px',
          flexShrink: 0
        }}>
          {result && (
            <div style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              fontSize: '12px', 
              fontWeight: 600, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: summary.ready 
                ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#ecfdf5')
                : (theme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fff5f5'),
              border: summary.ready 
                ? (theme === 'dark' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #10b981')
                : (theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #ef4444'),
              color: summary.ready 
                ? (theme === 'dark' ? '#4ade80' : '#047857')
                : (theme === 'dark' ? '#f87171' : '#b91c1c'),
              height: '32px',
              boxSizing: 'border-box'
            }}>
              <span>{summary.ready ? '● Pipeline Ready for Execution' : '● Pipeline contains validation errors.'}</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button 
              type="button" 
              className="tactile-btn"
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-inputs)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                outline: 'none',
                height: '32px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-inputs-hover)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-inputs)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export const SubmitButton = () => {
  const { nodes, edges, isExecuting } = useStore(
    (state) => ({ 
      nodes: state.nodes, 
      edges: state.edges,
      isExecuting: state.isExecuting
    }),
    shallow
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isRunHovered, setIsRunHovered] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const getErrorMessage = (err) => {
    if (!axios.isAxiosError(err)) {
      return 'Something went wrong. Please try again.';
    }
  
    if (err.code === 'ERR_NETWORK') {
      return 'Unable to reach the server. Is the backend running on port 8000?';
    }
  
    const detail = err.response?.data?.detail;
  
    if (typeof detail === 'string') {
      return detail;
    }
  
    if (Array.isArray(detail)) {
      return 'Invalid pipeline data. Please check your nodes and edges.';
    }
  
    if (err.response?.status) {
      return `Request failed with status ${err.response.status}.`;
    }
  
    return err.message || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async () => {
    if (isExecuting || isLoading) return;
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await axios.post(API_URL, { nodes, edges });
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsOpen(true);
    }
  };

  const handleRunSimulation = async () => {
    if (isExecuting || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Run backend parsing validation first
      const response = await axios.post(API_URL, { nodes, edges });
      const valResult = response.data;
      
      const hasErrors = valResult?.checks?.some(c => c.type === 'error' || c.severity === 'error') || !valResult?.summary?.ready;
      
      if (hasErrors) {
        // Validation failed, show modal and abort execution
        setResult(valResult);
        setIsOpen(true);
        return;
      }
      
      // 2. No validation errors - trigger simulation execution
      const store = useStore.getState();
      await runPipelineSimulation(store);
      
    } catch (err) {
      setError(getErrorMessage(err));
      setIsOpen(true); // Open modal with network/server details
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '6px 12px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-panels-glass)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px var(--shadow-color)',
          pointerEvents: 'auto',
          transition: 'all 200ms ease'
        }}
      >
        {/* Submit Pipeline Button */}
        <button
          type="button"
          className="tactile-btn"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: isExecuting ? 'var(--bg-inputs)' : (isSubmitHovered ? 'var(--bg-inputs-hover)' : 'var(--bg-cards)'),
            color: isExecuting ? 'var(--text-secondary)' : 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: (isLoading || isExecuting) ? 'not-allowed' : 'pointer',
            boxShadow: !isExecuting && isSubmitHovered 
              ? '0 2px 8px var(--shadow-hover)' 
              : '0 1px 2px var(--shadow-color)',
            transition: 'all 150ms ease',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isExecuting ? 0.6 : 1,
          }}
          onMouseEnter={() => !isExecuting && setIsSubmitHovered(true)}
          onMouseLeave={() => setIsSubmitHovered(false)}
          onClick={handleSubmit}
          disabled={isLoading || isExecuting}
        >
          {isLoading && !isExecuting && <Spinner />}
          {isLoading && !isExecuting ? 'Validating...' : 'Submit Pipeline'}
        </button>

        {/* Run Simulation Button */}
        <button
          type="button"
          className="tactile-btn"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isExecuting ? 'var(--color-success)' : (isRunHovered ? 'var(--color-primary-hover)' : 'var(--color-primary)'),
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: (isLoading || isExecuting) ? 'not-allowed' : 'pointer',
            boxShadow: isRunHovered && !isExecuting
              ? '0 2px 8px rgba(37, 99, 235, 0.25)' 
              : '0 1px 2px rgba(37, 99, 235, 0.15)',
            transition: 'all 150ms ease',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={() => !isExecuting && setIsRunHovered(true)}
          onMouseLeave={() => setIsRunHovered(false)}
          onClick={handleRunSimulation}
          disabled={isLoading || isExecuting}
        >
          {isExecuting ? (
            <>
              <svg 
                style={{ animation: 'spin 1s linear infinite' }} 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle' }}>
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Run Pipeline</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <ResultModal
          result={result}
          error={error}
          onClose={closeModal}
        />
      )}
    </>
  );
};

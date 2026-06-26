// toolbar.js

import { DraggableNode } from './draggableNode';
import { useStore } from './store';

export const PipelineToolbar = () => {
    const theme = useStore((state) => state.theme);
    const setTheme = useStore((state) => state.setTheme);

    return (
        <div style={{ 
            padding: '16px 24px', 
            borderBottom: '1px solid var(--border-color)', 
            background: 'var(--bg-panels)', 
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '16px' 
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <DraggableNode type='customInput' label='Input' />
                    <DraggableNode type='llm' label='LLM' />
                    <DraggableNode type='customOutput' label='Output' />
                    <DraggableNode type='text' label='Text' />
                    <DraggableNode type='prompt' label='Prompt' />
                    <DraggableNode type='condition' label='Condition' />
                    <DraggableNode type='api' label='API' />
                    <DraggableNode type='transform' label='Transform' />
                    <DraggableNode type='database' label='Database' />
                </div>
                
                {/* Theme Toggle Button */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-inputs)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '2px',
                    gap: '2px',
                }}>
                    <button 
                        onClick={() => setTheme('light')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: 'none',
                            borderRadius: '18px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            backgroundColor: theme === 'light' ? 'var(--bg-panels-opaque)' : 'transparent',
                            color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            boxShadow: theme === 'light' ? '0 1px 3px var(--shadow-color)' : 'none',
                            transition: 'all 200ms ease',
                        }}
                    >
                        🌞 Light
                    </button>
                    <button 
                        onClick={() => setTheme('dark')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: 'none',
                            borderRadius: '18px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            backgroundColor: theme === 'dark' ? 'var(--bg-panels-opaque)' : 'transparent',
                            color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            boxShadow: theme === 'dark' ? '0 1px 3px var(--shadow-color)' : 'none',
                            transition: 'all 200ms ease',
                        }}
                    >
                        🌙 Dark
                    </button>
                </div>
            </div>
        </div>
    );
};

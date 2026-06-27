import { useEffect } from 'react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { SimulatorDashboard } from './components/SimulatorDashboard';
import { CursorFollower } from './components/CursorFollower';
import { useStore } from './store';

function App() {
  const setTheme = useStore((state) => state.setTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('workflow-theme') || 'light';
    setTheme(savedTheme);
  }, [setTheme]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-primary)',
      transition: 'background-color 200ms ease, color 200ms ease',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <PipelineToolbar />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <PipelineUI />
        <SubmitButton />
      </div>
      <SimulatorDashboard />
      <CursorFollower />
    </div>
  );
}

export default App;

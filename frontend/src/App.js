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
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-primary)',
      transition: 'background-color 200ms ease, color 200ms ease'
    }}>
      <PipelineToolbar />
      <PipelineUI />
      <SubmitButton />
      <SimulatorDashboard />
      <CursorFollower />
    </div>
  );
}

export default App;

import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { SimulatorDashboard } from './components/SimulatorDashboard';
import { CursorFollower } from './components/CursorFollower';

function App() {
  return (
    <div>
      <PipelineToolbar />
      <PipelineUI />
      <SubmitButton />
      <SimulatorDashboard />
      <CursorFollower />
    </div>
  );
}

export default App;

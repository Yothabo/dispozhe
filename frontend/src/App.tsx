import { useState } from 'react';
import Background from './components/Background';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationCenter from './components/NotificationCenter';
import CreateSessionPage from './pages/CreateSessionPage';
import LandingPage from './pages/LandingPage';
import './styles/index.css';

function App() {
  const [hasStarted, setHasStarted] = useState(false);

  const handleStartChat = () => {
    setHasStarted(true);
  };

  const handleExit = () => {
    setHasStarted(false);
  };

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen">
        <Background />
        <NotificationCenter />
        <div className="relative z-10">
          {!hasStarted ? (
            <LandingPage onStartChat={handleStartChat} />
          ) : (
            <CreateSessionPage onExit={handleExit} />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;

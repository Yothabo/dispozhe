import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import CreateSessionPage from './pages/CreateSessionPage';
import Background from './components/Background';
import './styles/index.css';

function App() {
  const [hasStarted, setHasStarted] = useState(false);

  const handleStartChat = () => {
    console.log('Start chat clicked');
    setHasStarted(true);
  };

  const handleExit = () => {
    console.log('Exit clicked');
    setHasStarted(false);
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10">
        {!hasStarted ? (
          <LandingPage onStartChat={handleStartChat} />
        ) : (
          <CreateSessionPage onExit={handleExit} />
        )}
      </div>
    </div>
  );
}

export default App;

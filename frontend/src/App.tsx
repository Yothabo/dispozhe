import { useState, useEffect } from 'react';
import Background from './components/Background';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationCenter from './components/NotificationCenter';
import CreateSessionPage from './pages/CreateSessionPage';
import LandingPage from './pages/LandingPage';
import api from './services/api';
import './styles/index.css';

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    setApiUrl(api.getBaseUrl());
    console.log('App mounted, API URL:', api.getBaseUrl());
  }, []);

  const handleStartChat = () => {
    console.log('Start chat clicked');
    setHasStarted(true);
  };

  const handleExit = () => {
    console.log('Exit clicked');
    setHasStarted(false);
  };

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen">
        <Background />
        {/* Debug overlay */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: '#0A192F',
          border: '1px solid #64FFDA',
          color: '#64FFDA',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          API: {apiUrl || 'loading...'}
        </div>
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

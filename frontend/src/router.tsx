import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ChatJoin from './pages/ChatJoin';
import WaitingPage from './pages/WaitingPage';
import ChatPage from './pages/ChatPage';
import CreateSessionPage from './pages/CreateSessionPage';
import CodeEntryPage from './pages/CodeEntryPage';
import ActiveChat from './components/chat/ActiveChat';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/create',
    element: <CreateSessionPage onExit={() => window.location.href = '/'} />,
  },
  {
    path: '/code',
    element: <CodeEntryPage />,
  },
  {
    path: '/c/:sessionId',
    element: <ChatJoin />,
  },
  {
    path: '/waiting/:sessionId',
    element: <WaitingPage />,
  },
  {
    path: '/chat/:sessionId',
    element: <ActiveChat 
      sessionId={new URL(window.location.href).pathname.split('/')[2]} 
      duration={5} 
      encryptionKey={window.location.hash.substring(1)} 
      onTerminate={() => window.location.href = '/'} 
    />,
  },
]);

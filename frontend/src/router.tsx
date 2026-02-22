import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ChatJoin from './pages/ChatJoin';
import WaitingPage from './pages/WaitingPage';
import ChatPage from './pages/ChatPage';  // This now uses Stream Chat
import CreateSessionPage from './pages/CreateSessionPage';
import CodeEntryPage from './pages/CodeEntryPage';

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
    element: <ChatPage />,  // This uses Stream Chat
  },
]);

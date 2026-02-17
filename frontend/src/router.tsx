import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ChatJoin from './pages/ChatJoin';
import WaitingPage from './pages/WaitingPage';
import ChatPage from './pages/ChatPage';
import CreateSessionPage from './pages/CreateSessionPage';
import CodeEntryPage from './pages/CodeEntryPage';
import ActiveChat from './components/chat/ActiveChat';

// Function to update meta tags for chat invites
function updateMetaForInvite() {
  if (window.location.pathname.includes('/c/')) {
    document.title = 'Driflly · Private Chat Invitation';
    
    const updates = {
      'og:title': '🔐 You\'re invited to a private chat',
      'og:description': 'Join an encrypted conversation that will disappear when you\'re done. No sign-up required.',
      'twitter:title': '🔐 You\'re invited to a private chat',
      'twitter:description': 'Join an encrypted conversation that will disappear when you\'re done. No sign-up required.'
    };

    for (const [property, content] of Object.entries(updates)) {
      const meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) meta.setAttribute('content', content);
    }
  }
}

// Call it on route changes
if (typeof window !== 'undefined') {
  updateMetaForInvite();
}

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

// Listen for route changes
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', updateMetaForInvite);
}

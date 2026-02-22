import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import "stream-chat-react/dist/css/v2/index.css"

import { router } from './router'
import './styles/index.css'

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="color: red; padding: 20px; background: #0A192F; border: 1px solid #F87171; border-radius: 8px; margin: 20px;">
      <h3 style="color: #F87171; margin-bottom: 10px;">Application Error</h3>
      <pre style="color: #E6F1FF; white-space: pre-wrap;">${event.error?.stack || event.error || 'Unknown error'}</pre>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="color: red; padding: 20px; background: #0A192F; border: 1px solid #F87171; border-radius: 8px; margin: 20px;">
      <h3 style="color: #F87171; margin-bottom: 10px;">Unhandled Promise Rejection</h3>
      <pre style="color: #E6F1FF; white-space: pre-wrap;">${event.reason?.stack || event.reason || 'Unknown error'}</pre>
    </div>`;
  }
});

const root = document.getElementById('root');

if (!root) {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    );
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Failed to mount React app:', error);
    root.innerHTML = `<div style="color: red; padding: 20px; background: #0A192F; border: 1px solid #F87171; border-radius: 8px;">
      <h3 style="color: #F87171; margin-bottom: 10px;">Failed to Mount React App</h3>
      <pre style="color: #E6F1FF; white-space: pre-wrap;">${error instanceof Error ? error.stack : String(error)}</pre>
    </div>`;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

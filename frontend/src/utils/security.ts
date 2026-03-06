// Disable right-click on sensitive elements
export const disableRightClick = (enabled: boolean = true) => {
  if (!enabled) return;
  
  const handler = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };
  
  document.addEventListener('contextmenu', handler);
  return () => document.removeEventListener('contextmenu', handler);
};

// Disable copy/paste on sensitive inputs
export const disableCopyPaste = (element: HTMLElement | null, enabled: boolean = true) => {
  if (!element || !enabled) return;
  
  const handler = (e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  };
  
  element.addEventListener('copy', handler);
  element.addEventListener('cut', handler);
  element.addEventListener('paste', handler);
  
  return () => {
    element.removeEventListener('copy', handler);
    element.removeEventListener('cut', handler);
    element.removeEventListener('paste', handler);
  };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  // First, escape HTML special characters to prevent tag injection
  let sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;')
    .replace(/=/g, '&#61;');

  // Remove any event handler patterns (like onerror, onclick) that could appear as attributes
  // even after escaping. This is a simple regex that removes the word if it's followed by an equals sign.
  // This prevents XSS while allowing the word to appear in normal text (e.g., "I made an error").
  sanitized = sanitized.replace(/\b(on\w+)\s*&#61;/gi, '');

  // Also remove javascript: links
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  return sanitized;
};

// Generate short-lived token (simulated - actual token comes from backend)
export const isTokenValid = (_token: string, timestamp: number): boolean => {
  const now = Date.now();
  const tokenAge = now - timestamp;
  const maxAge = 60000; // 60 seconds
  return tokenAge < maxAge;
};

// Clear all session data
export const clearSessionData = (sessionId: string) => {
  // Remove from sessionStorage only (no localStorage used)
  sessionStorage.removeItem(`Driflly_messages_${sessionId}`);
  sessionStorage.removeItem(`Driflly_initiator_${sessionId}`);
  sessionStorage.removeItem(`Driflly_code_${sessionId}`);
  
  // Clear any in-memory data (handled by hooks)
};

// Prevent page caching
export const preventPageCache = () => {
  // Set no-cache headers via meta tags
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Cache-Control';
  meta.content = 'no-cache, no-store, must-revalidate';
  document.head.appendChild(meta);
  
  const meta2 = document.createElement('meta');
  meta2.httpEquiv = 'Pragma';
  meta2.content = 'no-cache';
  document.head.appendChild(meta2);
  
  const meta3 = document.createElement('meta');
  meta3.httpEquiv = 'Expires';
  meta3.content = '0';
  document.head.appendChild(meta3);
};

// Disable service workers for chat routes
export const disableServiceWorkers = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
};

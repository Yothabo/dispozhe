// This utility prevents accidental page refreshes during active chat
export const preventRefresh = (message: string = "This will disconnect you from the chat. Are you sure?") => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = message;
    return message;
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};

// This completely disables F5 and Ctrl+R (use with caution)
export const disableRefreshKeys = () => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // F5
    if (e.key === 'F5') {
      e.preventDefault();
      return false;
    }
    // Ctrl+R / Cmd+R
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+R / Cmd+Shift+R
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
      e.preventDefault();
      return false;
    }
    // Alt+F4 (can't prevent completely but we can try)
    if (e.altKey && e.key === 'F4') {
      e.preventDefault();
      return false;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};

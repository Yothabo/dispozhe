// Store the current termination state globally
let isTerminating = false;

export const setTerminatingState = (terminating: boolean) => {
  isTerminating = terminating;
};

export const preventRefresh = () => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Don't show warning if we're terminating
    if (isTerminating) {
      return;
    }
    
    e.preventDefault();
    e.returnValue = 'This will terminate your chat session. Are you sure?';
    return e.returnValue;
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};

// Disable refresh keys (F5, Ctrl+R, etc.)
export const disableRefreshKeys = () => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't block keys if we're terminating
    if (isTerminating) {
      return;
    }
    
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  window.addEventListener('keydown', handleKeyDown, { capture: true });
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown, { capture: true });
  };
};

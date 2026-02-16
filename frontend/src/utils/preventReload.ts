// Utility to prevent page reload/unload in chat sessions
export const preventChatReload = (message: string = "This will terminate your chat session. Are you sure?") => {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = message;
    return message;
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};

export const allowReload = () => {
  // No need to do anything - just let the page reload normally
};

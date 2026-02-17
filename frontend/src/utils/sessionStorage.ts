export interface StoredSession {
  sessionId: string;
  encryptionKey: string;
  duration: number;
  createdAt: number;
  lastActive: number;
  status: 'waiting' | 'active' | 'terminated';
  isInitiator: boolean;
}

const SESSION_STORAGE_KEY = 'chatlly_active_session';

export const sessionStorageUtil = {
  save: (session: StoredSession) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }
  },

  load: (): StoredSession | null => {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load session from localStorage', e);
      return null;
    }
  },

  updateLastActive: () => {
    try {
      const session = sessionStorageUtil.load();
      if (session) {
        session.lastActive = Date.now();
        sessionStorageUtil.save(session);
      }
    } catch (e) {
      console.error('Failed to update lastActive', e);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear session from localStorage', e);
    }
  },

  isExpired: (session: StoredSession, maxInactivityMs: number = 5 * 60 * 1000): boolean => {
    return Date.now() - session.lastActive > maxInactivityMs;
  }
};

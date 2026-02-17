import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  link?: string;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for management notifications only
  useEffect(() => {
    const handleManagementNotification = (event: CustomEvent<Notification>) => {
      const notification = event.detail;
      setNotifications(prev => [notification, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('management-notification', handleManagementNotification as EventListener);
    
    return () => {
      window.removeEventListener('management-notification', handleManagementNotification as EventListener);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    markAsRead();
  };

  // Only show bell if there are notifications
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={handleBellClick}
          className="p-3 bg-navy-light/80 backdrop-blur-sm rounded-full border border-white/10 hover:border-sky/30 transition-colors shadow-lg"
        >
          <FaBell className="w-5 h-5 text-sky" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-sky text-navy text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute bottom-16 right-0 w-80 sm:w-96 glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-navy-light/50">
              <h3 className="text-white font-bold">Management</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-grey hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-grey text-sm">
                  No notifications
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative group ${
                      notification.type === 'error' ? 'bg-red-500/5' :
                      notification.type === 'warning' ? 'bg-yellow-500/5' :
                      notification.type === 'success' ? 'bg-green-500/5' : ''
                    }`}
                  >
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes className="w-3 h-3 text-grey hover:text-white" />
                    </button>
                    <p className="text-sm text-white pr-6">{notification.message}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-grey/50">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                      {notification.link && (
                        <a 
                          href={notification.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-sky hover:underline"
                        >
                          Learn more
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export both the component and the notification function
export const notifyManagement = (
  message: string, 
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  link?: string
) => {
  const event = new CustomEvent('management-notification', {
    detail: {
      id: Math.random().toString(36).substring(7),
      message,
      type,
      timestamp: Date.now(),
      link
    }
  });
  window.dispatchEvent(event);
};

export default NotificationCenter;

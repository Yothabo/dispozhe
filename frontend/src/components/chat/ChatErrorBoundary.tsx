import React from 'react';
import api from '../../services/api';
import wsService from '../../services/websocket';
import { setTerminatingState } from '../../utils/preventRefresh';

interface Props {
  children: React.ReactNode;
  sessionId: string;
  onError?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reloadAttempted: boolean;
}

class ChatErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      reloadAttempted: false 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, reloadAttempted: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat error caught:', error, errorInfo);
  }

  handleReload = () => {
    if (!this.state.reloadAttempted) {
      this.setState({ reloadAttempted: true });
      window.location.reload();
    } else {
      this.handleForceTerminate();
    }
  };

  handleForceTerminate = async () => {
    try {
      await api.terminateSession(this.props.sessionId);
    } catch (err) {
      console.error('Failed to terminate:', err);
    } finally {
      sessionStorage.removeItem(`Driflly_initiator_${this.props.sessionId}`);
      sessionStorage.removeItem(`Driflly_code_${this.props.sessionId}`);
      sessionStorage.removeItem(`Driflly_messages_${this.props.sessionId}`);
      wsService.disconnect();
      wsService.setTerminating();
      setTerminatingState(true);
      window.location.href = '/';
    }
  };

  handleHome = () => {
    this.handleForceTerminate();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3 text-center">Chat Error</h2>
            <p className="text-grey mb-8 text-center">
              {this.state.reloadAttempted 
                ? "Reload failed. The session will now be terminated."
                : "Something went wrong with the chat. You can try reloading or go home."}
            </p>

            <div className="flex gap-3">
              {!this.state.reloadAttempted ? (
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors"
                >
                  Reload Page
                </button>
              ) : (
                <button
                  onClick={this.handleForceTerminate}
                  className="flex-1 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                >
                  Exit to Home
                </button>
              )}
              <button
                onClick={this.handleHome}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;

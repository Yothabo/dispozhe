import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Chat, Channel, MessageList, MessageInput, Window, Thread } from 'stream-chat-react';
import { chatClient, connectUser, disconnectUser, createChannel } from '../../lib/stream';
import 'stream-chat-react/dist/css/v2/index.css';

interface StreamChatWrapperProps {
  sessionId: string;
  userId: string;
  onTerminate: () => void;
  apiBaseUrl: string;
}

const StreamChatWrapper: React.FC<StreamChatWrapperProps> = ({
  sessionId,
  userId,
  onTerminate,
  apiBaseUrl
}) => {
  const [channel, setChannel] = useState<any>(null);
  const [clientReady, setClientReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const channelCreated = useRef(false);

  const connectWithRetry = useCallback(async () => {
    if (!import.meta.env.VITE_STREAM_API_KEY) {
      setError('Stream Chat API key is missing');
      return;
    }

    try {
      setConnectionStatus('connecting');
      setError(null);
      
      console.log('Fetching token for user:', userId);
      
      // Get token for this user
      const tokenResponse = await fetch(`${apiBaseUrl}/stream/token?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token fetch failed: ${tokenResponse.status} - ${errorText}`);
      }
      
      const { token } = await tokenResponse.json();
      console.log('Token received, connecting user...');

      // Connect this user
      await connectUser(userId, token);
      console.log('User connected:', userId);
      
      setClientReady(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;

      // Only create channel if it hasn't been created yet
      if (!channelCreated.current) {
        channelCreated.current = true;
        
        // The other user ID (will be created when they join)
        const otherUserId = `${sessionId}-other`;
        console.log('Creating channel with members:', [userId, otherUserId]);
        
        const newChannel = await createChannel(sessionId, [userId, otherUserId]);
        console.log('Channel created');
        setChannel(newChannel);
      }
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect');
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const delay = 2000 * reconnectAttempts.current;
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        setTimeout(connectWithRetry, delay);
      } else {
        setConnectionStatus('disconnected');
      }
    }
  }, [sessionId, userId, apiBaseUrl]);

  useEffect(() => {
    connectWithRetry();

    return () => {
      disconnectUser();
    };
  }, [connectWithRetry]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">Connection Failed</h3>
          <p className="text-grey text-sm mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={connectWithRetry}
              className="w-full px-4 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors"
            >
              Retry Connection
            </button>
            <button 
              onClick={onTerminate}
              className="w-full px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientReady || !channel) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-lg font-light">
            {connectionStatus === 'connecting' ? 'Connecting to chat...' : 'Setting up your session...'}
          </p>
          <p className="text-grey text-sm mt-2">
            {connectionStatus === 'connecting' ? 'This may take a few seconds' : 'Almost there'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-navy">
      <Chat client={chatClient} theme="messaging dark">
        <Channel channel={channel}>
          <Window>
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
      
      <button
        onClick={onTerminate}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-medium border border-red-500/20 hover:border-red-500/50"
      >
        End Chat
      </button>

      <div className="fixed bottom-4 left-4 z-50 px-3 py-1 bg-navy-light/80 backdrop-blur-sm rounded-full text-xs border border-white/10">
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
          connectionStatus === 'connected' ? 'bg-green-400' : 'bg-yellow-400'
        }`}></span>
        {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
      </div>
    </div>
  );
};

export default StreamChatWrapper;

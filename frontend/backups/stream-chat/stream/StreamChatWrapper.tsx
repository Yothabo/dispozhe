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
  const [isCreator, setIsCreator] = useState<boolean | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const channelCreated = useRef(false);
  const mounted = useRef(true);
  const pollInterval = useRef<NodeJS.Timeout>();

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      disconnectUser();
    };
  }, []);

  // Check if this user is the creator (initiator)
  useEffect(() => {
    try {
      const initiatorFlag = sessionStorage.getItem(`Driflly_initiator_${sessionId}`);
      console.log('Initiator flag from sessionStorage:', initiatorFlag);
      if (mounted.current) {
        setIsCreator(initiatorFlag === 'true');
      }
    } catch (err) {
      console.error('Error reading sessionStorage:', err);
    }
  }, [sessionId]);

  const connectToStream = useCallback(async () => {
    if (!mounted.current) return;

    if (!import.meta.env.VITE_STREAM_API_KEY) {
      if (mounted.current) setError('Stream Chat API key is missing');
      return;
    }

    if (isCreator === null) return;

    try {
      if (mounted.current) {
        setConnectionStatus('connecting');
        setError(null);
      }
      
      console.log('Fetching token for user:', userId);
      
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
      console.log('Token received');

      await connectUser(userId, token);
      console.log('User connected to Stream Chat');
      
      if (!mounted.current) return;
      
      setClientReady(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;

      // Only the creator creates the channel
      if (isCreator && !channelCreated.current) {
        channelCreated.current = true;
        
        const otherUserId = `${sessionId}-other`;
        console.log('Creator creating channel with members:', [userId, otherUserId]);
        
        try {
          const newChannel = await createChannel(sessionId, [userId, otherUserId]);
          console.log('Channel created successfully:', newChannel.id);
          if (mounted.current) {
            setChannel(newChannel);
          }
        } catch (channelErr) {
          console.error('Channel creation failed:', channelErr);
          if (mounted.current) {
            setError(`Failed to create chat channel: ${channelErr instanceof Error ? channelErr.message : 'Unknown error'}`);
          }
        }
      } else if (!isCreator) {
        console.log('Joiner looking for existing channel...');
        
        const findChannel = async () => {
          try {
            const channel = chatClient.channel('messaging', sessionId);
            await channel.watch();
            console.log('Joiner found existing channel');
            if (mounted.current) {
              setChannel(channel);
            }
            return true;
          } catch (err) {
            return false;
          }
        };

        // Try immediately
        const found = await findChannel();
        
        if (!found && mounted.current) {
          console.log('Channel not found, polling...');
          pollInterval.current = setInterval(async () => {
            if (!mounted.current) {
              if (pollInterval.current) clearInterval(pollInterval.current);
              return;
            }
            const exists = await findChannel();
            if (exists && pollInterval.current) {
              clearInterval(pollInterval.current);
            }
          }, 2000);

          // Stop polling after 30 seconds
          setTimeout(() => {
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
            }
          }, 30000);
        }
      }
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      if (mounted.current) {
        setError(error instanceof Error ? error.message : 'Failed to connect');
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = 2000 * reconnectAttempts.current;
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          setTimeout(connectToStream, delay);
        } else {
          setConnectionStatus('disconnected');
        }
      }
    }
  }, [sessionId, userId, apiBaseUrl, isCreator]);

  useEffect(() => {
    if (isCreator !== null) {
      connectToStream();
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [connectToStream, isCreator]);

  // Error display
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
              onClick={connectToStream}
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

  // Loading states
  if (isCreator === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-lg font-light">Initializing session...</p>
        </div>
      </div>
    );
  }

  if (!clientReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-lg font-light">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (!channel && isCreator) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-lg font-light">Creating chat room...</p>
          <p className="text-grey text-sm mt-2">Share the code with the other person</p>
        </div>
      </div>
    );
  }

  if (!channel && !isCreator) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-lg font-light">Waiting for chat room...</p>
          <p className="text-grey text-sm mt-2">The other person should be online</p>
        </div>
      </div>
    );
  }

  // Chat UI
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

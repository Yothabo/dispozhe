import React, { useEffect, useState, useRef } from 'react';
import wsService from '../../services/websocket';

interface WebSocketMessage {
  type: string;
  connection_count?: number;
  data?: string;
  [key: string]: unknown;
}

interface SimpleChatProps {
  sessionId: string;
  _userId?: string; // kept for API compatibility
  onTerminate: () => void;
}

const SimpleChat: React.FC<SimpleChatProps> = ({ sessionId, onTerminate }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (data: WebSocketMessage) => {
      if (data.type === 'connected') {
        setIsConnected(true);
        setConnectionCount(data.connection_count || 0);
        addMessage(`✅ Connected to session (${data.connection_count}/2 users)`);
      } else if (data.type === 'message' && data.data) {
        try {
          const text = atob(data.data as string);
          addMessage(`👤 Other: ${text}`);
        } catch {
          addMessage(`📦 Received: ${data.type}`);
        }
      } else if (data.type === 'ping') {
        // Auto-responded by service
      } else {
        addMessage(`📦 ${data.type}`);
      }
    };

    wsService.addMessageHandler(handleMessage);

    wsService.connect(sessionId).catch((err: Error) => {
      console.error('Connection failed:', err);
      addMessage(`❌ Connection failed: ${err.message}`);
    });

    return () => {
      wsService.removeMessageHandler(handleMessage);
      wsService.disconnect();
    };
  }, [sessionId]);

  const addMessage = (text: string) => {
    setMessages(prev => [...prev, text]);
  };

  const sendMessage = () => {
    if (!inputText.trim() || !wsService.isConnected()) return;

    const encrypted = btoa(inputText);
    wsService.sendMessage({
      type: 'message',
      data: encrypted,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });

    addMessage(`👤 You: ${inputText}`);
    setInputText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0A192F',
      color: '#E6F1FF'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#112240',
        borderBottom: '1px solid #233554',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ color: '#64FFDA', fontWeight: 'bold' }}>Session: </span>
          <span style={{ fontFamily: 'monospace' }}>{sessionId}</span>
        </div>
        <div>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#4ADE80' : '#F87171',
            marginRight: '8px'
          }}></span>
          <span>{isConnected ? `Connected (${connectionCount}/2)` : 'Disconnected'}</span>
        </div>
        <button
          onClick={onTerminate}
          style={{
            backgroundColor: '#F87171',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          End Chat
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              backgroundColor: msg.startsWith('👤 You') ? '#64FFDA' : '#233554',
              color: msg.startsWith('👤 You') ? '#0A192F' : '#E6F1FF',
              borderRadius: '8px',
              alignSelf: msg.startsWith('👤 You') ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              wordBreak: 'break-word'
            }}
          >
            {msg}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        backgroundColor: '#112240',
        borderTop: '1px solid #233554',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#0A192F',
            border: '1px solid #233554',
            borderRadius: '8px',
            color: '#E6F1FF',
            outline: 'none'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || !inputText.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#64FFDA',
            color: '#0A192F',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            opacity: (!isConnected || !inputText.trim()) ? 0.5 : 1
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default SimpleChat;

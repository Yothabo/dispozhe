import React from 'react';
import MessageBubble from './messages/MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  otherUserTyping: boolean;
  otherUserLeft: boolean;
  timeUp: boolean;
  onViewFile: (message: Message) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  otherUserTyping,
  otherUserLeft,
  timeUp,
  onViewFile,
  messagesEndRef
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {messages.map((m) => {
        if (m.sender === 'system') {
          return (
            <div key={m.id} className="flex justify-center">
              <div className="bg-white/5 px-4 py-2 rounded-full">
                <p className="text-xs text-grey">{m.text}</p>
              </div>
            </div>
          );
        }
        return (
          <MessageBubble
            key={m.id}
            message={m}
            onViewFile={onViewFile}
          />
        );
      })}
      {otherUserTyping && !otherUserLeft && !timeUp && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

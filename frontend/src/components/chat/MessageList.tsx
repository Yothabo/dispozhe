import React from 'react';
import MessageContainer from './messages/MessageContainer';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  otherUserTyping: boolean;
  otherUserLeft: boolean;
  timeUp: boolean;
  onViewFile: (message: Message) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  style: React.CSSProperties;
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  otherUserTyping,
  otherUserLeft,
  timeUp,
  onViewFile,
  messagesEndRef,
  messagesContainerRef,
  style,
  className
}) => {
  return (
    <div
      ref={messagesContainerRef}
      style={style}
      className={className}
    >
      <div className="max-w-4xl mx-auto">
        <MessageContainer
          messages={messages}
          otherUserTyping={otherUserTyping}
          otherUserLeft={otherUserLeft}
          timeUp={timeUp}
          onViewFile={onViewFile}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  );
};

export default MessageList;

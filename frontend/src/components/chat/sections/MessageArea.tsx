import React from 'react';
import MessageContainer from '../messages/MessageContainer';
import { Message } from '../types';

interface MessageAreaProps {
  messages: Message[];
  otherUserTyping: boolean;
  otherUserLeft: boolean;
  timeUp: boolean;
  sessionEnded: boolean;
  onViewFile: (message: Message) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageArea: React.FC<MessageAreaProps> = ({
  messages,
  otherUserTyping,
  otherUserLeft,
  timeUp,
  sessionEnded,
  onViewFile,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-4">
      <div className="max-w-4xl mx-auto py-4">
        <MessageContainer
          messages={messages}
          otherUserTyping={otherUserTyping}
          otherUserLeft={otherUserLeft}
          timeUp={timeUp || sessionEnded}
          onViewFile={onViewFile}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  );
};

export default MessageArea;

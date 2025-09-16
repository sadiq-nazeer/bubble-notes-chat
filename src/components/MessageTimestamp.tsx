
import React from 'react';
import { Message } from '../store/notesStore';

interface MessageTimestampProps {
  message: Message;
}

const MessageTimestamp: React.FC<MessageTimestampProps> = ({ message }) => {
  return (
    <div className="hidden sm:block w-10 sm:w-12 flex-shrink-0 text-center pt-1.5 space-y-0">
      <div className="text-[8px] text-muted-foreground/70 leading-none">
        {new Date(message.timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}
      </div>
      {message.edited && (
        <div className="inline-block bg-primary/10 text-primary px-0.5 py-0 rounded text-[8px] leading-none mt-0">
          Edited
        </div>
      )}
    </div>
  );
};

export default MessageTimestamp;


import React from 'react';
import { Message } from '../store/notesStore';
import { useMessageEdit } from '../hooks/useMessageEdit';
import MessageTimestamp from './MessageTimestamp';
import MessageContent from './MessageContent';
import MessageActions from './MessageActions';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast }) => {
  const {
    isEditing,
    editContent,
    setEditContent,
    textareaRef,
    editContainerRef,
    handleEdit,
    handleSave,
    handleCancel,
    handleKeyDown
  } = useMessageEdit(message);

  return (
    <div className="flex justify-start group" ref={editContainerRef}>
      <div className="flex items-start space-x-2 w-full max-w-3xl">
        <MessageTimestamp message={message} />
        
        <MessageContent
          message={message}
          isEditing={isEditing}
          editContent={editContent}
          setEditContent={setEditContent}
          textareaRef={textareaRef}
          handleKeyDown={handleKeyDown}
          handleEdit={handleEdit}
        />
        
        <MessageActions
          message={message}
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleSave={handleSave}
          handleCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default MessageBubble;

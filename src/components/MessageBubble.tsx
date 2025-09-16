
import React from 'react';
import { useMessageEdit } from '../hooks/useMessageEdit';
import { Message } from '../store/notesStore';
import MessageContent from './MessageContent';
import MessageTimestamp from './MessageTimestamp';

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
    <div className="flex justify-start group py-0.5 w-full" ref={editContainerRef}>
      <div className="flex items-start space-x-2 w-full">
        <MessageTimestamp message={message} />
        <MessageContent
          message={message}
          isEditing={isEditing}
          editContent={editContent}
          setEditContent={setEditContent}
          textareaRef={textareaRef}
          handleKeyDown={handleKeyDown}
          handleEdit={handleEdit}
          handleSave={handleSave}
          handleCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default MessageBubble;

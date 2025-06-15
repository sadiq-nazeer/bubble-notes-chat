
import React from 'react';
import { Message } from '../store/notesStore';

interface MessageContentProps {
  message: Message;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleEdit: () => void;
}

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  isEditing,
  editContent,
  setEditContent,
  textareaRef,
  handleKeyDown,
  handleEdit
}) => {
  const renderContent = () => {
    const baseClasses = "leading-snug";
    
    if (isEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none leading-snug"
          rows={Math.max(2, editContent.split('\n').length)}
        />
      );
    }
    
    switch (message.format) {
      case 'h1':
        return <h1 className={`text-2xl font-bold ${baseClasses}`}>{message.content}</h1>;
      case 'h2':
        return <h2 className={`text-xl font-bold ${baseClasses}`}>{message.content}</h2>;
      case 'h3':
        return <h3 className={`text-lg font-bold ${baseClasses}`}>{message.content}</h3>;
      case 'bold':
        return <p className={`font-bold ${baseClasses}`}>{message.content}</p>;
      case 'italic':
        return <p className={`italic ${baseClasses}`}>{message.content}</p>;
      case 'ul':
        return (
          <ul className="list-disc list-inside space-y-0">
            {message.content.split('\n').map((item, idx) => (
              <li key={idx} className={baseClasses}>{item}</li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol className="list-decimal list-inside space-y-0">
            {message.content.split('\n').map((item, idx) => (
              <li key={idx} className={baseClasses}>{item}</li>
            ))}
          </ol>
        );
      default:
        return <p className={baseClasses}>{message.content}</p>;
    }
  };

  return (
    <div
      className="message-bubble animate-scale-in cursor-pointer flex-1 py-2 px-3"
      onClick={!isEditing ? handleEdit : undefined}
    >
      {message.image && (
        <div className="mb-2">
          <img
            src={message.image}
            alt="Uploaded content"
            className="max-w-full h-auto rounded-xl neuro-inset p-2"
            style={{ maxWidth: '300px' }}
          />
        </div>
      )}
      
      <div className="text-foreground">
        {renderContent()}
      </div>
    </div>
  );
};

export default MessageContent;

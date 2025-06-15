
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
  const parseLineFormat = (line: string) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ')) {
      return { format: 'h1', content: trimmedLine.substring(2) };
    } else if (trimmedLine.startsWith('## ')) {
      return { format: 'h2', content: trimmedLine.substring(3) };
    } else if (trimmedLine.startsWith('### ')) {
      return { format: 'h3', content: trimmedLine.substring(4) };
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
      return { format: 'bold', content: trimmedLine.slice(2, -2) };
    } else if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*') && trimmedLine.length > 2) {
      return { format: 'italic', content: trimmedLine.slice(1, -1) };
    } else if (trimmedLine.startsWith('- ')) {
      return { format: 'ul', content: trimmedLine.substring(2) };
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      return { format: 'ol', content: trimmedLine.replace(/^\d+\.\s/, '') };
    }
    
    return { format: 'plain', content: trimmedLine };
  };

  const renderFormattedLine = (format: string, content: string, index: number) => {
    const baseClasses = "leading-snug";
    const key = `line-${index}`;
    
    switch (format) {
      case 'h1':
        return <h1 key={key} className={`text-2xl font-bold ${baseClasses} mb-2`}>{content}</h1>;
      case 'h2':
        return <h2 key={key} className={`text-xl font-bold ${baseClasses} mb-1.5`}>{content}</h2>;
      case 'h3':
        return <h3 key={key} className={`text-lg font-bold ${baseClasses} mb-1`}>{content}</h3>;
      case 'bold':
        return <p key={key} className={`font-bold ${baseClasses}`}>{content}</p>;
      case 'italic':
        return <p key={key} className={`italic ${baseClasses}`}>{content}</p>;
      case 'ul':
        return <div key={key} className="flex items-start"><span className="mr-2">•</span><span className={baseClasses}>{content}</span></div>;
      case 'ol':
        return <div key={key} className="flex items-start"><span className="mr-2">{index + 1}.</span><span className={baseClasses}>{content}</span></div>;
      default:
        return <p key={key} className={baseClasses}>{content}</p>;
    }
  };

  const renderContent = () => {
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
    
    // Handle multi-line content with different formats per line
    const lines = message.content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length > 1) {
      // Multi-line message - parse each line for its own format
      return (
        <div className="space-y-1">
          {lines.map((line, index) => {
            const { format, content } = parseLineFormat(line);
            return renderFormattedLine(format, content, index);
          })}
        </div>
      );
    } else {
      // Single line message - use the message's format
      const baseClasses = "leading-snug";
      const content = message.content;
      
      switch (message.format) {
        case 'h1':
          return <h1 className={`text-2xl font-bold ${baseClasses}`}>{content}</h1>;
        case 'h2':
          return <h2 className={`text-xl font-bold ${baseClasses}`}>{content}</h2>;
        case 'h3':
          return <h3 className={`text-lg font-bold ${baseClasses}`}>{content}</h3>;
        case 'bold':
          return <p className={`font-bold ${baseClasses}`}>{content}</p>;
        case 'italic':
          return <p className={`italic ${baseClasses}`}>{content}</p>;
        case 'ul':
          return (
            <ul className="list-disc list-inside space-y-0">
              {content.split('\n').map((item, idx) => (
                <li key={idx} className={baseClasses}>{item}</li>
              ))}
            </ul>
          );
        case 'ol':
          return (
            <ol className="list-decimal list-inside space-y-0">
              {content.split('\n').map((item, idx) => (
                <li key={idx} className={baseClasses}>{item}</li>
              ))}
            </ol>
          );
        default:
          return <p className={baseClasses} style={{ whiteSpace: 'pre-line' }}>{content}</p>;
      }
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

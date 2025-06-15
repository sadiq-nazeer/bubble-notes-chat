import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotesStore, Message } from '../store/notesStore';
import { Edit, Trash2, Check, X, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast }) => {
  const { deleteMessage, editMessage } = useNotesStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSave = useCallback(() => {
    if (editContent.trim()) {
      editMessage(message.id, editContent.trim(), message.format, message.image);
    }
    setIsEditing(false);
  }, [editContent, message.id, message.format, message.image, editMessage]);
  
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, handleSave]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      toast.success("Message copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy message.");
      console.error("Failed to copy: ", err);
    });
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const renderContent = () => {
    const baseClasses = "leading-relaxed";
    
    if (isEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none"
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
          <ul className="list-disc list-inside space-y-1">
            {message.content.split('\n').map((item, idx) => (
              <li key={idx} className={baseClasses}>{item}</li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol className="list-decimal list-inside space-y-1">
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
    <div className="flex justify-start group" ref={editContainerRef}>
      <div className="flex items-start space-x-2 w-full max-w-3xl">
        <div className="w-14 flex-shrink-0 text-center text-[9px] text-muted-foreground/90 pt-2 space-y-0.5">
          <span className="block leading-tight">
            {new Date(message.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
          {message.edited && (
            <span className="inline-block bg-primary/10 text-primary px-1 py-0.5 rounded-full font-medium text-[8px] leading-tight">
              Edited
            </span>
          )}
        </div>

        <div
          className="message-bubble animate-scale-in cursor-pointer flex-1"
          onClick={!isEditing ? handleEdit : undefined}
        >
          {message.image && (
            <div className="mb-3">
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
        
        <div className="flex-shrink-0 flex flex-col items-center space-y-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="neuro-button rounded-lg p-2 text-green-500 hover:text-green-600"
                aria-label="Save changes"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                className="neuro-button rounded-lg p-2 text-gray-500 hover:text-gray-600"
                aria-label="Cancel edit"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopy}
                className="neuro-button rounded-lg p-2 text-blue-500 hover:text-blue-600"
                aria-label="Copy message"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleEdit}
                className="neuro-button rounded-lg p-2 text-primary hover:text-primary/80"
                aria-label="Edit message"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => deleteMessage(message.id)}
                className="neuro-button rounded-lg p-2 text-red-400 hover:text-red-600"
                aria-label="Delete message"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

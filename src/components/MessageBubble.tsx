import React, { useState, useRef, useEffect } from 'react';
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

  const handleSave = () => {
    if (editContent.trim()) {
      editMessage(message.id, editContent.trim(), message.format, message.image);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      toast.success("Message copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy message.");
      console.error("Failed to copy: ", err);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

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
    <div className="flex justify-start group">
      <div className="flex items-start space-x-3 max-w-2xl">
        <div 
          className="message-bubble animate-scale-in cursor-pointer"
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
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <div className="text-[11px] text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
              {message.edited && (
                <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium text-[10px]">
                  Edited
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="neuro-button rounded-lg p-2 text-green-500 hover:text-green-600 text-xs"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={handleCancel}
                className="neuro-button rounded-lg p-2 text-gray-500 hover:text-gray-600 text-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopy}
                className="neuro-button rounded-lg p-2 text-blue-500 hover:text-blue-600 text-xs"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={handleEdit}
                className="neuro-button rounded-lg p-2 text-primary hover:text-primary/80 text-xs"
              >
                <Edit className="h-3 w-3" />
              </button>
              <button
                onClick={() => deleteMessage(message.id)}
                className="neuro-button rounded-lg p-2 text-red-400 hover:text-red-600 text-xs"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

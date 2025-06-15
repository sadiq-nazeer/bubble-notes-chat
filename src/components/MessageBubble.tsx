
import React from 'react';
import { useNotesStore, Message } from '../store/notesStore';
import { Edit, Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast }) => {
  const { deleteMessage, setEditing, isEditing } = useNotesStore();

  const renderContent = () => {
    const baseClasses = "leading-relaxed";
    
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
    <div className="flex justify-end group">
      <div className="flex items-start space-x-3 max-w-2xl">
        <div className="flex-shrink-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
          <button
            onClick={() => setEditing(message.id)}
            className="neuro-button rounded-lg p-2 text-blue-500 hover:text-blue-600 text-xs"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button
            onClick={() => deleteMessage(message.id)}
            className="neuro-button rounded-lg p-2 text-red-400 hover:text-red-600 text-xs"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        
        <div className="message-bubble animate-scale-in">
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
          
          <div className="text-slate-700">
            {renderContent()}
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50">
            <div className="text-xs text-slate-400">
              {message.timestamp}
              {message.edited && (
                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                  Edited
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

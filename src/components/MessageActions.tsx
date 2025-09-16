
import { Copy, Trash2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { Message, useNotesStore } from '../store/notesStore';

interface MessageActionsProps {
  message: Message;
}

const MessageActions: React.FC<MessageActionsProps> = ({ message }) => {
  const { deleteMessage } = useNotesStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      toast.success('Message copied to clipboard!');
    }).catch(err => {
      toast.error('Failed to copy message.');
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="neuro-button rounded-lg p-2 text-blue-500 hover:text-blue-600"
        aria-label="Copy message"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={() => deleteMessage(message.id)}
        className="neuro-button rounded-lg p-1.5 text-red-400 hover:text-red-600"
        aria-label="Delete message"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
};

export default MessageActions;

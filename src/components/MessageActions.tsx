
import React from 'react';
import { useNotesStore, Message } from '../store/notesStore';
import { Edit, Trash2, Check, X, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MessageActionsProps {
  message: Message;
  isEditing: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  handleCancel: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isEditing,
  handleEdit,
  handleSave,
  handleCancel
}) => {
  const { deleteMessage } = useNotesStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      toast.success("Message copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy message.");
      console.error("Failed to copy: ", err);
    });
  };

  return (
    <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {isEditing ? (
        <>
          <button
            onClick={handleSave}
            className="neuro-button rounded-lg p-1.5 text-green-500 hover:text-green-600"
            aria-label="Save changes"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={handleCancel}
            className="neuro-button rounded-lg p-1.5 text-gray-500 hover:text-gray-600"
            aria-label="Cancel edit"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleCopy}
            className="neuro-button rounded-lg p-1.5 text-blue-500 hover:text-blue-600"
            aria-label="Copy message"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={handleEdit}
            className="neuro-button rounded-lg p-1.5 text-primary hover:text-primary/80"
            aria-label="Edit message"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button
            onClick={() => deleteMessage(message.id)}
            className="neuro-button rounded-lg p-1.5 text-red-400 hover:text-red-600"
            aria-label="Delete message"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
};

export default MessageActions;

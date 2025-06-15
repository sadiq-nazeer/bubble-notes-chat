
import React, { useState, useRef } from 'react';
import { useNotesStore, Message } from '../store/notesStore';
import { Bold, Italic, Image as ImageIcon, Edit } from 'lucide-react';

const MessageInput: React.FC = () => {
  const { addMessage, editMessage, isEditing, setEditing, getActiveNote } = useNotesStore();
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<Message['format']>('plain');
  const [image, setImage] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = getActiveNote();
  const editingMessage = isEditing ? activeNote?.messages.find(m => m.id === isEditing) : null;

  React.useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      setFormat(editingMessage.format);
      setImage(editingMessage.image);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!content.trim() && !image) return;

    if (isEditing) {
      editMessage(isEditing, content, format, image);
    } else {
      addMessage(content, format, image);
    }

    setContent('');
    setFormat('plain');
    setImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setContent('');
    setFormat('plain');
    setImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatButtons = [
    { key: 'plain', label: 'Normal', active: format === 'plain' },
    { key: 'h1', label: 'H1', active: format === 'h1' },
    { key: 'h2', label: 'H2', active: format === 'h2' },
    { key: 'h3', label: 'H3', active: format === 'h3' },
    { key: 'bold', label: 'Bold', icon: Bold, active: format === 'bold' },
    { key: 'italic', label: 'Italic', icon: Italic, active: format === 'italic' },
    { key: 'ul', label: 'Bullets', active: format === 'ul' },
    { key: 'ol', label: 'Numbers', active: format === 'ol' },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Format Toolbar */}
      <div className="flex flex-wrap gap-2">
        {formatButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFormat(btn.key as Message['format'])}
            className={`neuro-button rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              btn.active 
                ? 'text-blue-600 ring-2 ring-blue-400/30 neuro-pressed' 
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            <div className="flex items-center space-x-1">
              {btn.icon && <btn.icon className="h-4 w-4" />}
              <span>{btn.label}</span>
            </div>
          </button>
        ))}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="neuro-button rounded-xl px-3 py-2 text-sm text-slate-600 hover:text-blue-600 font-medium transition-all"
        >
          <div className="flex items-center space-x-1">
            <ImageIcon className="h-4 w-4" />
            <span>Image</span>
          </div>
        </button>
      </div>

      {/* Image Preview */}
      {image && (
        <div className="neuro-inset rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <img
              src={image}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-xl neuro-subtle p-1"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-2">Image attached</p>
              <button
                onClick={() => setImage(undefined)}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Remove image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Input */}
      <div className="neuro-inset rounded-2xl p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Type your ${format !== 'plain' ? format.toUpperCase() + ' ' : ''}message...`}
          className="w-full bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 resize-none"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {isEditing ? 'Editing message...' : 'Press Enter to send, Shift+Enter for new line'}
        </div>
        
        <div className="flex space-x-3">
          {isEditing && (
            <button
              onClick={handleCancel}
              className="neuro-button rounded-xl px-6 py-2 text-slate-600 hover:text-slate-700 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() && !image}
            className={`neuro-button rounded-xl px-6 py-2 font-semibold transition-all ${
              content.trim() || image
                ? 'text-blue-600 hover:text-blue-700 ring-2 ring-blue-400/20 hover:ring-blue-400/30'
                : 'text-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            {isEditing ? 'Update' : 'Send'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;

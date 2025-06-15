
import React, { useState, useRef } from 'react';
import { useNotesStore, Message } from '../store/notesStore';
import { Bold, Italic, Image as ImageIcon } from 'lucide-react';

const MessageInput: React.FC = () => {
  const { addMessage } = useNotesStore();
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<Message['format']>('plain');
  const [image, setImage] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    addMessage(content, format, image);
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
    <div className="p-4 space-y-3">
      {/* Format Toolbar - Compact */}
      <div className="flex flex-wrap gap-1">
        {formatButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFormat(btn.key as Message['format'])}
            className={`neuro-button rounded-lg px-2 py-1 text-xs font-medium transition-all ${
              btn.active 
                ? 'text-primary ring-1 ring-primary/30 neuro-pressed' 
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <div className="flex items-center space-x-1">
              {btn.icon && <btn.icon className="h-3 w-3" />}
              <span>{btn.label}</span>
            </div>
          </button>
        ))}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="neuro-button rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-primary font-medium transition-all"
        >
          <div className="flex items-center space-x-1">
            <ImageIcon className="h-3 w-3" />
            <span>Image</span>
          </div>
        </button>
      </div>

      {/* Image Preview - Compact */}
      {image && (
        <div className="neuro-inset rounded-xl p-3">
          <div className="flex items-start space-x-3">
            <img
              src={image}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg neuro-subtle p-1"
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground mb-1">Image attached</p>
              <button
                onClick={() => setImage(undefined)}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Input - Compact */}
      <div className="neuro-inset rounded-xl p-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Type your ${format !== 'plain' ? format.toUpperCase() + ' ' : ''}message...`}
          className="w-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none text-sm"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      {/* Action Buttons - Compact */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!content.trim() && !image}
          className={`neuro-button rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            content.trim() || image
              ? 'text-primary hover:text-primary/80 ring-1 ring-primary/20 hover:ring-primary/30'
              : 'text-muted-foreground cursor-not-allowed opacity-50'
          }`}
        >
          Send
        </button>
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

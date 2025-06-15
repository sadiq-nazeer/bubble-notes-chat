
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

  const getFormatPrefix = (selectedFormat: Message['format']): string => {
    switch (selectedFormat) {
      case 'h1': return '# ';
      case 'h2': return '## ';
      case 'h3': return '### ';
      case 'ul': return '- ';
      case 'ol': return '1. ';
      default: return '';
    }
  };

  const getPlaceholder = (selectedFormat: Message['format']): string => {
    const prefix = getFormatPrefix(selectedFormat);
    switch (selectedFormat) {
      case 'h1': return `${prefix}Type your heading...`;
      case 'h2': return `${prefix}Type your heading...`;
      case 'h3': return `${prefix}Type your heading...`;
      case 'bold': return 'Type your **bold** text...';
      case 'italic': return 'Type your *italic* text...';
      case 'ul': return `${prefix}Type your list item...`;
      case 'ol': return `${prefix}Type your list item...`;
      default: return 'Type your message... Use # for headings, **bold**, *italic*, `code`';
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

  const renderTextareaContent = () => {
    const prefix = getFormatPrefix(format);
    if (!prefix) return null;

    return (
      <div className="absolute inset-0 pointer-events-none flex items-start pt-2 px-3">
        <span className="text-primary/60 font-mono text-sm">{prefix}</span>
      </div>
    );
  };

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

      {/* Text Input with Format Prefix - Compact */}
      <div className="neuro-inset rounded-xl p-3 relative">
        {renderTextareaContent()}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={getPlaceholder(format)}
          className={`w-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none text-sm ${
            getFormatPrefix(format) ? 'pl-8' : ''
          }`}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      {/* Format Help Text */}
      {format !== 'plain' && (
        <div className="text-[10px] text-muted-foreground/70 px-2">
          {format === 'bold' && 'Wrap text with **bold** for formatting'}
          {format === 'italic' && 'Wrap text with *italic* for formatting'}
          {(format === 'h1' || format === 'h2' || format === 'h3') && 'Each line will be formatted as a heading'}
          {format === 'ul' && 'Each line will be a bullet point'}
          {format === 'ol' && 'Each line will be numbered'}
        </div>
      )}

      {/* Action Buttons - Compact */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground/70 leading-none">
          Enter to send, Shift+Enter for new line
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

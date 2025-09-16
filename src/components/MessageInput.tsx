
import { ChevronDown, Send } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import RichTextEditor from './RichTextEditor';

const MessageInput: React.FC = () => {
  const { addMessage } = useNotesStore();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(true);

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

    addMessage(content, 'plain', image);
    setContent('');
    setImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-3 space-y-2">
      {/* Top toggle when collapsed */}
      {!isOpen && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="neuro-button rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:text-primary transition-all flex items-center gap-1"
            aria-label="Show message input"
          >
            <span>Show input</span>
            <ChevronDown className="h-3 w-3 -rotate-90" />
          </button>
        </div>
      )}
      {/* Image Preview */}
      {isOpen && image && (
        <div className="neuro-inset rounded-xl p-3">
          <div className="flex items-start space-x-3">
            <img
              src={image}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg neuro-subtle p-1"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">Image attached</p>
              <button
                onClick={() => setImage(undefined)}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rich Text Editor with inline controls */}
      {isOpen && (
        <div className="relative">
          <RichTextEditor
            onContentChange={setContent}
            onSubmit={handleSubmit}
            placeholder="Type your message..."
            showImageButton={true}
            onImageClick={() => fileInputRef.current?.click()}
            rightActions={(
              <button
                onClick={() => setIsOpen(false)}
                className="neuro-button rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:text-primary transition-all flex items-center gap-1"
                aria-label="Hide message input"
              >
                <span>Hide</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          />
          
          {/* Send button positioned next to input */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 z-40">
            <button
              onClick={handleSubmit}
              disabled={!content.trim() && !image}
              className={`neuro-button rounded-lg p-2 transition-all ${
                content.trim() || image
                  ? 'text-primary hover:text-primary/80 ring-1 ring-primary/20 hover:ring-primary/30'
                  : 'text-muted-foreground cursor-not-allowed opacity-50'
              }`}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Compact help text */}
      {isOpen && (
        <div className="text-xs text-muted-foreground/60 px-1">
          Enter to send • Shift+Enter for new line
        </div>
      )}

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

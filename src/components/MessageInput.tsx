
import React, { useState, useRef } from 'react';
import { useNotesStore } from '../store/notesStore';
import { Image as ImageIcon } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const MessageInput: React.FC = () => {
  const { addMessage } = useNotesStore();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="p-4 space-y-3">
      {/* Image Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="neuro-button rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-primary font-medium transition-all"
        >
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span>Add Image</span>
          </div>
        </button>
      </div>

      {/* Image Preview */}
      {image && (
        <div className="neuro-inset rounded-xl p-3">
          <div className="flex items-start space-x-3">
            <img
              src={image}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg neuro-subtle p-1"
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

      {/* Rich Text Editor */}
      <RichTextEditor
        onContentChange={setContent}
        onSubmit={handleSubmit}
        placeholder="Type your message... Use different formats for each line"
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground/70 leading-none">
          Rich text formatting enabled
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!content.trim() && !image}
          className={`neuro-button rounded-lg px-6 py-2 text-sm font-semibold transition-all ${
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

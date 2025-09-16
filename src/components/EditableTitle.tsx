import React, { useState, useRef, useEffect } from 'react';
import { useNotesStore } from '../store/notesStore';

interface EditableTitleProps {
  noteId: string;
  title: string;
  className?: string;
}

const EditableTitle: React.FC<EditableTitleProps> = ({ noteId, title, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateNoteTitle } = useNotesStore();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(title);
  };

  const handleSave = () => {
    const newTitle = editValue.trim();
    if (newTitle && newTitle !== title) {
      updateNoteTitle(noteId, newTitle);
    } else if (!newTitle) {
      setEditValue(title); // Reset to original if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(title);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`text-xl font-bold text-foreground bg-background border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${className}`}
        placeholder="Enter note title..."
      />
    );
  }

  return (
    <h2 
      className={`text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors ${className}`}
      onClick={handleStartEdit}
    >
      {title}
    </h2>
  );
};

export default EditableTitle;


import { useState, useRef, useEffect, useCallback } from 'react';
import { useNotesStore, Message } from '../store/notesStore';

export const useMessageEdit = (message: Message) => {
  const { editMessage } = useNotesStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

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

  const handleSave = useCallback(() => {
    if (editContent.trim()) {
      editMessage(message.id, editContent.trim(), message.format, message.image);
    }
    setIsEditing(false);
  }, [editContent, message.id, message.format, message.image, editMessage]);
  
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, handleSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  return {
    isEditing,
    editContent,
    setEditContent,
    textareaRef,
    editContainerRef,
    handleEdit,
    handleSave,
    handleCancel,
    handleKeyDown
  };
};


import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  content: string;
  format: 'plain' | 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'ul' | 'ol';
  image?: string;
  timestamp: string;
  edited: boolean;
}

export interface Note {
  id: string;
  title: string;
  messages: Message[];
  lastModified: string;
}

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  isEditing: string | null;
  
  // Actions
  createNote: () => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string) => void;
  
  addMessage: (content: string, format: Message['format'], image?: string) => void;
  editMessage: (messageId: string, content: string, format: Message['format'], image?: string) => void;
  deleteMessage: (messageId: string) => void;
  
  setEditing: (messageId: string | null) => void;
  
  getActiveNote: () => Note | null;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const formatTimestamp = (date: Date) => {
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,
      isEditing: null,

      createNote: () => {
        const newNote: Note = {
          id: generateId(),
          title: `Note ${get().notes.length + 1}`,
          messages: [],
          lastModified: formatTimestamp(new Date())
        };
        
        set(state => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id
        }));
      },

      deleteNote: (id: string) => {
        set(state => ({
          notes: state.notes.filter(note => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
        }));
      },

      setActiveNote: (id: string) => {
        set({ activeNoteId: id });
      },

      addMessage: (content: string, format: Message['format'], image?: string) => {
        const newMessage: Message = {
          id: generateId(),
          content,
          format,
          image,
          timestamp: formatTimestamp(new Date()),
          edited: false
        };

        set(state => ({
          notes: state.notes.map(note => 
            note.id === state.activeNoteId
              ? {
                  ...note,
                  messages: [...note.messages, newMessage],
                  lastModified: newMessage.timestamp
                }
              : note
          )
        }));
      },

      editMessage: (messageId: string, content: string, format: Message['format'], image?: string) => {
        set(state => ({
          notes: state.notes.map(note => 
            note.id === state.activeNoteId
              ? {
                  ...note,
                  messages: note.messages.map(msg =>
                    msg.id === messageId
                      ? {
                          ...msg,
                          content,
                          format,
                          image,
                          edited: true,
                          timestamp: formatTimestamp(new Date())
                        }
                      : msg
                  ),
                  lastModified: formatTimestamp(new Date())
                }
              : note
          ),
          isEditing: null
        }));
      },

      deleteMessage: (messageId: string) => {
        set(state => ({
          notes: state.notes.map(note => 
            note.id === state.activeNoteId
              ? {
                  ...note,
                  messages: note.messages.filter(msg => msg.id !== messageId),
                  lastModified: formatTimestamp(new Date())
                }
              : note
          )
        }));
      },

      setEditing: (messageId: string | null) => {
        set({ isEditing: messageId });
      },

      getActiveNote: () => {
        const state = get();
        return state.notes.find(note => note.id === state.activeNoteId) || null;
      }
    }),
    {
      name: 'notes-storage',
      version: 1
    }
  )
);


import React from 'react';
import { useNotesStore } from '../store/notesStore';
import { Edit, Trash2 } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { notes, activeNoteId, createNote, deleteNote, setActiveNote } = useNotesStore();

  return (
    <div className="w-80 h-full neuro-base border-r border-slate-200/50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-700">Notes</h1>
          <button
            onClick={createNote}
            className="neuro-button rounded-xl px-4 py-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            New Note
          </button>
        </div>
        
        <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[calc(100vh-120px)]">
          {notes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Edit className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">No notes yet</p>
              <p className="text-sm">Create your first note to get started</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`group relative neuro-subtle rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:neuro-base ${
                  activeNoteId === note.id ? 'ring-2 ring-blue-400/30 neuro-pressed' : ''
                }`}
                onClick={() => setActiveNote(note.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-700 truncate mb-1">
                      {note.title}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">
                      {note.messages.length > 0 
                        ? note.messages[note.messages.length - 1].content.substring(0, 50) + '...'
                        : 'Empty note'
                      }
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {note.lastModified}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="neuro-button rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {note.messages.length > 0 && (
                  <div className="flex items-center mt-2 text-xs text-slate-400">
                    <span className="bg-slate-200 px-2 py-1 rounded-full">
                      {note.messages.length} message{note.messages.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

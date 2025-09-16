import { Edit, Trash2 } from "lucide-react";
import React from "react";
import { useNotesStore } from "../store/notesStore";
import ThemeToggle from "./ThemeToggle";

const Sidebar: React.FC = () => {
  const { notes, activeNoteId, createNote, deleteNote, setActiveNote } =
    useNotesStore();

  return (
    <div className="w-60 h-full border-r border-border p-2">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Notes</h1>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={createNote}
            className="neuro-button rounded-lg px-3 py-1.5 text-primary text-sm font-semibold hover:text-primary/80 transition-colors"
          >
            New Note
          </button>
        </div>
      </div>

      <div className="space-y-2 custom-scrollbar max-h-[calc(100vh-110px)]">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Edit className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No notes yet</p>
            <p className="text-sm">Create your first note to get started</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`group relative shadow-uniform rounded-xl p-3 cursor-pointer transition-all duration-200 hover:neuro-base ${
                activeNoteId === note.id ? "active-note" : ""
              }`}
              onClick={() => setActiveNote(note.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate mb-0.5 text-md">
                    {note.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {note.messages.length > 0
                      ? note.messages[
                          note.messages.length - 1
                        ].content.substring(0, 100) + "..."
                      : "Empty note"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 mb-0.5 leading-none">
                    <span className="text-[10px] text-muted-foreground/80">
                      {note.lastModified}
                    </span>
                    {note.messages.length > 0 && (
                      <span className="text-[10px] text-muted-foreground/70">
                         {note.messages.length} Msg
                        {note.messages.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="neuro-button rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;

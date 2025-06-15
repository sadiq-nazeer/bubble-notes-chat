
import React, { useEffect, useRef } from 'react';
import { useNotesStore } from '../store/notesStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatWindow: React.FC = () => {
  const { getActiveNote, activeNoteId } = useNotesStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeNote = getActiveNote();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeNote?.messages]);

  if (!activeNoteId || !activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="neuro-base rounded-3xl p-12 max-w-md">
            <div className="neuro-inset rounded-2xl p-8 mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/40 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">💭</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Welcome to Notes</h2>
            <p className="text-muted-foreground leading-relaxed">
              Select a note from the sidebar or create a new one to start your conversation with yourself.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="neuro-base border-b border-border px-6 py-4">
        <h2 className="text-xl font-bold text-foreground">{activeNote.title}</h2>
        <p className="text-sm text-muted-foreground">
          {activeNote.messages.length} message{activeNote.messages.length !== 1 ? 's' : ''} • Last updated {activeNote.lastModified}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
        <div className="space-y-4">
          {activeNote.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="neuro-inset rounded-2xl p-8 inline-block">
                <span className="text-4xl mb-4 block">✨</span>
                <p className="text-muted-foreground text-lg font-medium">Start your conversation</p>
                <p className="text-muted-foreground text-sm mt-2">Type your first message below</p>
              </div>
            </div>
          ) : (
            activeNote.messages.map((message, index) => (
              <div key={message.id} className="animate-slide-up">
                <MessageBubble 
                  message={message}
                  isLast={index === activeNote.messages.length - 1}
                />
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Reduced size */}
      <div className="neuro-base border-t border-border">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatWindow;

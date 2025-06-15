
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="neuro-base rounded-3xl p-12 max-w-md">
            <div className="neuro-inset rounded-2xl p-8 mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl text-white font-bold">💭</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-3">Welcome to Notes</h2>
            <p className="text-slate-500 leading-relaxed">
              Select a note from the sidebar or create a new one to start your conversation with yourself.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="neuro-base border-b border-slate-200/50 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-700">{activeNote.title}</h2>
        <p className="text-sm text-slate-500">
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
                <p className="text-slate-500 text-lg font-medium">Start your conversation</p>
                <p className="text-slate-400 text-sm mt-2">Type your first message below</p>
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

      {/* Input */}
      <div className="neuro-base border-t border-slate-200/50">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatWindow;

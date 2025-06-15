
import React from 'react';
import { ThemeProvider } from '../components/ThemeProvider';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const Index = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="notes-theme">
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="h-screen flex">
          <Sidebar />
          <ChatWindow />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;

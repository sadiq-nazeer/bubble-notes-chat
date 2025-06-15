
import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="h-screen flex">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
};

export default Index;

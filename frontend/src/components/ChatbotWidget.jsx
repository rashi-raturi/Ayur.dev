import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { MessageCircle } from 'lucide-react';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      
      {/* Chat icon button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          className="bg-primary hover:bg-green-800 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </>
  );
};

export default ChatbotWidget;

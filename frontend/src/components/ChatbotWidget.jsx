import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { MessageCircle, X } from 'lucide-react';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      
      {/* Chat icon button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className={`group relative bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isOpen ? 'rotate-0' : 'hover:rotate-12'
          }`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Chat with AyurMind"
        >
          {isOpen ? (
            <X className="w-7 h-7 transition-transform" />
          ) : (
            <MessageCircle className="w-7 h-7 transition-transform" />
          )}
          
          {/* Pulse animation ring */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-green-600 animate-ping opacity-20"></span>
          )}
          
          {/* Notification badge (optional - can be shown when there's a new message) */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
              Chat with VaaniAI
              <div className="absolute top-full right-6 -mt-1">
                <div className="border-8 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatbotWidget;

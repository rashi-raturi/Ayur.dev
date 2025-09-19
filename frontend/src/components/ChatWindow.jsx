import React, { useState, useEffect } from 'react';

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // 👋 Add default intro message from Ayur.chat
  useEffect(() => {
    const welcomeMessage = {
      role: 'bot',
      content: "Hi! I'm Ayur.chat, your friendly health assistant. How can I help you today?",
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage = { role: 'bot', content: data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '⚠️ Error talking to server. Please try again later.',
      }]);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 bg-white border rounded-lg shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b bg-primary text-white rounded-t-lg">
        <span className="font-semibold">Ayur.chat</span>
        <button onClick={onClose} className="text-xl font-bold hover:text-gray-300">&times;</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-md max-w-[70%] break-words ${
              msg.role === 'user'
                ? 'bg-gray-100 text-black self-end ml-auto'
                : 'bg-primary text-white'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex border-t p-2">
        <input
          className="flex-1 px-3 py-1 border rounded-md mr-2 text-sm"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button
          className="bg-primary text-white px-3 py-1 rounded-md text-sm"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;

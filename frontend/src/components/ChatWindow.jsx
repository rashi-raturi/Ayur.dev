import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, X } from 'lucide-react';

// Generate unique session ID
const generateSessionId = () => {
  let sessionId = localStorage.getItem('ayurmind_session');
  if (!sessionId) {
    sessionId = 'ayurmind_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ayurmind_session', sessionId);
  }
  return sessionId;
};

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const messagesEndRef = useRef(null);
  
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const savedMessages = localStorage.getItem(`ayurmind_chat_${sessionId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      const welcomeMsg = {
        id: Date.now(),
        type: 'bot',
        content: "🌿 **Namaste! I'm AyuMind** \\n\\nYour Ayurvedic wellness companion! ✨\\n\\n• **Dosha guidance** 🧘\\n• **Natural remedies** 🌱\\n• **Diet tips** 🥗\\n• **Lifestyle advice** 💚\\n\\nAsk me anything about Ayurveda! 🙏",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
    }
  }, [sessionId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ayurmind_chat_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  // Send message to AyuMind
  const sendMessage = async () => {
    const messageText = inputMessage.trim();
    if (!messageText) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('🚀 Sending message to AyuMind:', messageText);
      
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText })
      });

      const data = await response.json();
      console.log('📩 Received response:', data);

      if (data.success !== false && data.reply) {
        const botMsg = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.reply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(data.reply || 'No response received');
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: '🌿 I apologize, but I am having trouble connecting right now. Please try again in a moment. I am here to help you with your Ayurvedic wellness questions!',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-40">
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] h-[550px] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">AyuMind</h3>
              <p className="text-green-100 text-xs">Ayurvedic Assistant</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.type === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : msg.isError
                    ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-sm'
                }`}
              >
                {msg.type === 'bot' ? (
                  <div className="prose prose-xs max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-strong:text-gray-900 text-xs">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs">{msg.content}</p>
                )}
              </div>

              {msg.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Ayurveda..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-xs"
                rows="1"
                disabled={isTyping}
                style={{ 
                  minHeight: '40px',
                  maxHeight: '120px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 ${
                inputMessage.trim() && !isTyping
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

ChatWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ChatWindow;
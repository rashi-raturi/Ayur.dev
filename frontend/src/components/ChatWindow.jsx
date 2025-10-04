import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { getSessionId } from './utils/session';
import { Download, Send, Bot, User, X, Minimize2 } from 'lucide-react';

export default function ChatWindow({ onClose }) {
  const sessionId = getSessionId();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const messagesEndRef = useRef(null);

  const url = import.meta.env.VITE_RAG_URL

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // on mount: load saved chat or show welcome
  useEffect(() => {
    const saved = sessionStorage.getItem(`ayur_chat_${sessionId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      const welcomeMessage = { role: 'bot', content: "Hi! I'm **VaaniAI**, your friendly Ayurvedic assistant. 🌿\n\nI can help you with:\n- Diet recommendations\n- Wellness advice\n- Ayurvedic remedies\n- Health queries\n\nHow can I assist you today?" };
      setMessages([welcomeMessage]);
    }
  }, [sessionId]);

  // persist chat whenever messages change
  useEffect(() => {
    sessionStorage.setItem(`ayur_chat_${sessionId}`, JSON.stringify(messages));
  }, [messages, sessionId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${url}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': getSessionId()
        },
        body: JSON.stringify({ question: input }),
      });

      const data = await res.json().catch(() => ({}));

      let botContent = '';
      let rawData = null;
      let isFinalChart = false;
      let mode = data.mode || 'text';

      if (mode === 'diet') {
        botContent = data.diet_chart || "⚠️ No diet chart returned.";
        rawData = data.diet_chart;
        isFinalChart = data.is_final_chart || false;
      } else if (mode === 'pdf') {
        botContent = data.wellness_report || "⚠️ No wellness report returned.";
        rawData = data.wellness_report;
        isFinalChart = data.is_wellness_ready || true;
      } else {
        botContent = data.answer || "⚠️ No response from server.";
      }

      const botMessage = { role: 'bot', content: botContent, rawData, mode, isFinalChart };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: '⚠️ Error talking to server. Please try again later.', hasError: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (rawData, mode) => {
    if (!rawData) return;
    setDownloadingPdf(true);
    try {
      const endpoint = mode === 'diet' ? '/diet-chart/pdf' : '/diet-chart/pdf';
      const res = await fetch(`${url}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Id': getSessionId()
        },
        body: JSON.stringify({ dietChart: rawData })
      });

      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mode === 'diet' ? 'ayurveda_diet_chart.pdf' : 'ayurveda_wellness_report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-24 right-4 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AyurMind</h3>
            <p className="text-xs text-white/80">Your Ayurvedic Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
                }`}
              >
                <div className={`text-sm leading-relaxed ${
                  msg.role === 'bot' ? 'prose prose-sm prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 max-w-none' : ''
                }`}>
                  {msg.role === 'bot' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Download button for diet or wellness report */}
                {msg.role === 'bot' && msg.rawData && msg.isFinalChart && (
                  <button
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all text-xs font-semibold shadow-md hover:shadow-lg disabled:opacity-50"
                    onClick={() => handleDownloadPdf(msg.rawData, msg.mode)}
                    disabled={downloadingPdf}
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingPdf ? 'Generating...' : 'Download PDF'}</span>
                  </button>
                )}
              </div>
              <span className={`text-xs text-gray-400 mt-1 block ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
            rows="1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={loading}
            style={{ maxHeight: '80px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
            }}
          />
          <button
            className={`p-3 rounded-xl transition-all ${
              input.trim() && !loading
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Powered by Ayurvedic AI • Press Enter to send
        </p>
      </div>
    </div>
  );
}

// validate props
ChatWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
};

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getSessionId } from './utils/session';
import { Download, Send } from 'lucide-react';

export default function ChatWindow({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const welcomeMessage = {
      role: 'bot',
      content: "Hi! I'm Ayur.chat, your friendly Ayurvedic assistant. How can I help you today?",
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/ask', {
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
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
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
    <div className="fixed bottom-20 right-4 w-80 h-96 bg-white border rounded-lg shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b bg-primary text-white rounded-t-lg">
        <span className="font-semibold">Ayur.chat</span>
        <button onClick={onClose} className="text-xl font-bold hover:text-gray-300">&times;</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-md max-w-[70%] break-words ${
              msg.role === 'user' ? 'bg-gray-100 text-black self-end ml-auto' : 'bg-primary text-white'
            }`}
          >
            {msg.role === 'bot' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}

            {/* Download button for diet or wellness report */}
            {msg.role === 'bot' && msg.rawData && msg.isFinalChart && (
              <button
                className="mt-2 flex items-center space-x-2 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                onClick={() => handleDownloadPdf(msg.rawData, msg.mode)}
                disabled={downloadingPdf}
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
              </button>
            )}
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
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          className="bg-primary text-white px-3 py-1 rounded-md text-sm"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

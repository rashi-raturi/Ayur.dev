import React, { useState } from "react";
import { Send, User, Bot, Download } from "lucide-react";
import { getSessionId } from './utils/session';
import ReactMarkdown from "react-markdown";

export default function DietChartGenerator() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Base URL for AI/chat and PDF endpoints (must be VITE_RAG_URL in .env)
  const url = import.meta.env.VITE_RAG_URL

  const processDietChartData = (rawData) => {
    // Process your specific format here
    // This is a placeholder - replace with your actual format processing
    try {
      if (typeof rawData === 'string') {
        return rawData;
      }
      
      // Example processing for structured data
      if (rawData.meals) {
        let formatted = "🍽️ **Your Personalized Diet Chart**\n\n";
        
        Object.entries(rawData.meals).forEach(([mealType, meal]) => {
          formatted += `**${mealType.toUpperCase()}**\n`;
          if (meal.items) {
            meal.items.forEach(item => {
              formatted += `• ${item.name} - ${item.quantity}\n`;
            });
          }
          if (meal.calories) {
            formatted += `Calories: ${meal.calories}\n`;
          }
          formatted += `\n`;
        });
        
        if (rawData.nutrition) {
          formatted += "📊 **Daily Nutrition Summary**\n";
          Object.entries(rawData.nutrition).forEach(([key, value]) => {
            formatted += `• ${key}: ${value}\n`;
          });
          formatted += `\n`;
        }
        
        if (rawData.tips) {
          formatted += "💡 **Tips & Recommendations**\n";
          rawData.tips.forEach(tip => {
            formatted += `• ${tip}\n`;
          });
        }
        
        return formatted;
      }
      
      // Fallback to JSON if structure is unknown
      return JSON.stringify(rawData, null, 2);
    } catch (error) {
      return rawData;
    }
  };

  const handleDownloadPdf = async (messageContent) => {
  setDownloadingPdf(true);

  try {
    const res = await fetch(`${url}/diet-chart/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
      body: JSON.stringify({ dietChart: messageContent }),
    });

    if (!res.ok) throw new Error("Failed to generate PDF");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ayuchart-diet-plan.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Failed to download PDF. Please try again.");
  } finally {
    setDownloadingPdf(false);
  }
};

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    
    setLoading(true);
    setInput("");

        try {
      const res = await fetch(`${url}/ask`, {
        method: "POST",

       headers: { 
         "Content-Type": "application/json",
         "X-Session-Id": getSessionId()
       },
       body: JSON.stringify({ question: input }),
      });

      const data = await res.json();

      
      const botMessage = {
  type: "bot",
  content: data.error ? data.error : data.diet_chart || data.answer || "",
  rawData: (data.diet_chart || data.meals) ? data : null,
  hasError: !!data.error,
  isFinalChart: !!data.is_final_chart 
};


      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        type: "bot",
        content: "Failed to fetch diet chart. Please try again.",
        hasError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="flex flex-col h-screen w-full mx-auto bg-primary rounded-lg">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            {/* AyuChart Title */}
            <h1 className="text-8xl font-bold text-white mb-6">AyuChart</h1>
            <p className="text-xl text-white mb-8">Get personalized nutrition recommendations</p>
            
            {/* Text Area */}
            <div className="max-w-3xl mx-auto mb-8 bg-primary">
              <div className="relative">
                <textarea
                  placeholder="Describe your dietary needs, health goals, allergies, age, activity level..."
                  className="w-full p-4 pr-12 bg-gray-200 border-2 border-gray-300 rounded-xl resize-none focus:border-primary transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows="4"
                  style={{ minHeight: '120px' }}
                />
                <button
                  className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                    input.trim() && !loading
                      ? 'bg-primary text-white hover:bg-primary/90' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Suggestion Options */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <button
                className="group p-4 text-left border border-gray-300 rounded-xl hover:bg-yellow-100 hover:border-black transition-all bg-gray-200"
                onClick={() => handleSuggestionClick("I'm a 25-year-old vegetarian looking to lose weight")}
              >
                <div className="font-semibold text-gray-900 mb-1 group-hover:text-black">Weight Loss Plan</div>
                <div className="text-sm text-black">Vegetarian, 25 years old</div>
              </button>
              <button 
                className="group p-4 text-left border border-gray-300 rounded-xl hover:bg-yellow-100 hover:border-black transition-all bg-gray-200"
                onClick={() => handleSuggestionClick("I need a muscle building diet plan, I'm 28 and go to gym 5 times a week")}
              >
                <div className="font-semibold text-gray-900 mb-1 group-hover:text-black">Muscle Building</div>
                <div className="text-sm text-black">High protein, gym routine</div>
              </button>
              <button 
                className="group p-4 text-left border border-gray-300 rounded-xl hover:bg-yellow-100 hover:border-black transition-all bg-gray-200"
                onClick={() => handleSuggestionClick("I have diabetes and need a balanced diet plan")}
              >
                <div className="font-semibold text-gray-900 mb-1 group-hover:text-black">Diabetic Diet</div>
                <div className="text-sm text-black">Blood sugar management</div>
              </button>
              <button 
                className="group p-4 text-left border border-gray-300 rounded-xl hover:bg-yellow-100 hover:border-black transition-all bg-gray-200"
                onClick={() => handleSuggestionClick("I'm pregnant and need nutritional guidance")}
              >
                <div className="font-semibold text-gray-900 mb-1 group-hover:text-black">Pregnancy Nutrition</div>
                <div className="text-sm text-black">Mother and baby health</div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : ''}`}>
                {message.type === 'bot' && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-3xl ${
                  message.type === 'user' 
                    ? 'bg-primary text-white rounded-2xl rounded-br-md px-4 py-3' 
                    : 'bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3'
                }`}>
                  <div className={`${message.type === 'user' ? 'text-white' : 'text-gray-900 prose prose-sm max-w-none'}`}>
                   {message.type === 'bot' 
                     ? <ReactMarkdown>{message.content}</ReactMarkdown>
                     : message.content}
                </div>
                  {message.type === 'bot' && message.rawData && !message.hasError && message.isFinalChart && (
  <div className="mt-4 pt-3 border-t border-gray-200">
    <button
      onClick={() => handleDownloadPdf(message.content)}
      disabled={downloadingPdf}
      className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
    >
      <Download className="w-4 h-4" />
      <span>{downloadingPdf ? 'Generating PDF...' : 'Download Diet Chart PDF'}</span>
    </button>
  </div>
)}


                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                    <span className="text-gray-600 text-sm">Generating your personalized diet chart...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Input Area for Chat Mode */}
            <div className="sticky bottom-0 border-t border-primary p-4 -mx-4 bg-primary">
              <div className="flex items-end space-x-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <textarea
                    placeholder="Ask follow-up questions or request modifications..."
                    className="w-full p-3 pr-12 bg-gray-200 border-2 border-gray-300 rounded-xl resize-none focus:border-primary transition-colors"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    rows="1"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all ${
                      input.trim() && !loading
                        ? 'bg-primary text-white hover:bg-primary/90' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-white text-center mt-2">
                This AI provides general dietary suggestions. Consult healthcare professionals for medical conditions.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

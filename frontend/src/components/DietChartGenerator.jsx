import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, User, Bot, Download } from "lucide-react";
import { getSessionId } from './utils/session';

export default function DietChartGenerator() {
  const sessionId = getSessionId();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Base URL for AI/chat and PDF endpoints (must be VITE_RAG_URL in .env)
  const url = import.meta.env.VITE_RAG_URL

  // load saved diet chat on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(`ayur_diet_${sessionId}`);
    if (saved) setMessages(JSON.parse(saved));
  }, [sessionId]);

  // persist diet chat whenever messages change
  useEffect(() => {
    sessionStorage.setItem(`ayur_diet_${sessionId}`, JSON.stringify(messages));
  }, [messages, sessionId]);

  /* eslint-disable no-unused-vars */
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
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* Chat Messages */}
        <div className="flex flex-col space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-8 md:py-16">
              {/* AyuChart Title */}
              <div className="mb-8">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4">AyuChart</h1>
                <p className="text-xl md:text-2xl text-gray-600">Get personalized Ayurvedic nutrition recommendations</p>
              </div>
              
              {/* Text Area */}
              <div className="max-w-4xl mx-auto mb-10">
                <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <textarea
                    placeholder="Describe your dietary needs, health goals, allergies, age, activity level, Prakruti (constitution)..."
                    className="w-full p-6 bg-white resize-none focus:outline-none text-gray-900 placeholder-gray-400"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    rows="5"
                    style={{ minHeight: '140px' }}
                  />
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Press Enter to send, Shift+Enter for new line</p>
                    <button
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                        input.trim() && !loading
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                    >
                      <Send className="w-5 h-5" />
                      Generate Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestion Options */}
              <div className="max-w-5xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-700 mb-6">Or try one of these examples:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    className="group p-6 text-left bg-white border-2 border-purple-100 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all transform hover:-translate-y-1"
                    onClick={() => handleSuggestionClick("I'm a 25-year-old vegetarian with Vata constitution looking to lose weight gradually")}
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                      <span className="text-2xl">🥗</span>
                    </div>
                    <div className="font-bold text-gray-900 mb-2">Weight Loss Plan</div>
                    <div className="text-sm text-gray-600">Vegetarian, Vata, 25 years</div>
                  </button>
                  
                  <button 
                    className="group p-6 text-left bg-white border-2 border-red-100 rounded-2xl hover:border-red-300 hover:shadow-xl transition-all transform hover:-translate-y-1"
                    onClick={() => handleSuggestionClick("I need a muscle building diet plan with Pitta constitution, I'm 28 and go to gym 5 times a week")}
                  >
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                      <span className="text-2xl">💪</span>
                    </div>
                    <div className="font-bold text-gray-900 mb-2">Muscle Building</div>
                    <div className="text-sm text-gray-600">High protein, Pitta, gym routine</div>
                  </button>
                  
                  <button 
                    className="group p-6 text-left bg-white border-2 border-blue-100 rounded-2xl hover:border-blue-300 hover:shadow-xl transition-all transform hover:-translate-y-1"
                    onClick={() => handleSuggestionClick("I have diabetes and need a balanced Ayurvedic diet plan for Kapha constitution")}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <span className="text-2xl">🩺</span>
                    </div>
                    <div className="font-bold text-gray-900 mb-2">Diabetic Diet</div>
                    <div className="text-sm text-gray-600">Blood sugar management, Kapha</div>
                  </button>
                  
                  <button 
                    className="group p-6 text-left bg-white border-2 border-pink-100 rounded-2xl hover:border-pink-300 hover:shadow-xl transition-all transform hover:-translate-y-1"
                    onClick={() => handleSuggestionClick("I'm pregnant and need nutritional guidance according to Ayurveda")}
                  >
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
                      <span className="text-2xl">🤰</span>
                    </div>
                    <div className="font-bold text-gray-900 mb-2">Pregnancy Nutrition</div>
                    <div className="text-sm text-gray-600">Mother and baby health</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-6">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'bot' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className={`max-w-4xl ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl rounded-br-md px-6 py-4 shadow-lg' 
                      : 'bg-white rounded-3xl rounded-bl-md px-6 py-4 shadow-lg border border-gray-200'
                  }`}>
                    <div className={`${message.type === 'user' ? 'text-white' : 'text-gray-900 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700'}`}>
                      {message.type === 'bot' 
                        ? <ReactMarkdown>{message.content}</ReactMarkdown>
                        : message.content}
                    </div>
                    {message.type === 'bot' && message.rawData && !message.hasError && message.isFinalChart && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleDownloadPdf(message.content)}
                          disabled={downloadingPdf}
                          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
                        >
                          <Download className="w-5 h-5" />
                          <span>{downloadingPdf ? 'Generating PDF...' : 'Download Diet Chart PDF'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {message.type === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-white rounded-3xl rounded-bl-md px-6 py-4 shadow-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                      <span className="text-gray-700 font-medium">Generating your personalized diet chart...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area for Chat Mode */}
              <div className="sticky bottom-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pt-4 pb-6 -mx-4 px-4 md:-mx-6 md:px-6">
                <div className="max-w-5xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-end">
                      <textarea
                        placeholder="Ask follow-up questions or request modifications..."
                        className="flex-1 p-4 bg-white resize-none focus:outline-none text-gray-900 placeholder-gray-400"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        rows="1"
                        style={{ minHeight: '56px', maxHeight: '120px' }}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                      />
                      <button
                        className={`m-2 p-3 rounded-xl transition-all ${
                          input.trim() && !loading
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 text-center mt-3">
                    💡 This AI provides general dietary suggestions based on Ayurvedic principles. Consult healthcare professionals for medical conditions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

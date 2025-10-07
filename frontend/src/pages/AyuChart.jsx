import React, { useState } from 'react';
import PageTransition from '../components/PageTransition';
import { Send, Loader, Sparkles, Apple, Heart, Users, Baby } from 'lucide-react';

const AyuChart = () => {
  const [userInput, setUserInput] = useState('');
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState('');

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const examples = [
    {
      icon: <Apple className="w-6 h-6 text-green-600" />,
      title: "Weight Loss Plan",
      description: "Vegetarian, Vata, 25 years",
      prompt: "I am a 25-year-old vegetarian with Vata constitution. I want to lose weight healthily while maintaining energy levels."
    },
    {
      icon: <Heart className="w-6 h-6 text-red-600" />,
      title: "Muscle Building",
      description: "High protein, Pitta, gym routine",
      prompt: "I am 28 years old with Pitta constitution, go to gym regularly, and want to build muscle mass with proper Ayurvedic nutrition."
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "Diabetic Diet",
      description: "Blood sugar management, Kapha",
      prompt: "I am 45 years old with Kapha constitution and type 2 diabetes. I need an Ayurvedic diet plan to manage blood sugar levels."
    },
    {
      icon: <Baby className="w-6 h-6 text-pink-600" />,
      title: "Pregnancy Nutrition",
      description: "Mother and baby health",
      prompt: "I am 3 months pregnant and need an Ayurvedic nutrition plan for healthy pregnancy and baby development."
    }
  ];

  const generateDietPlan = async () => {
    if (!userInput.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ayuchart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          description: userInput.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Clean up the response by removing code block markers
        let cleanPlan = data.dietPlan;
        
        // Remove ```html at the beginning
        cleanPlan = cleanPlan.replace(/^```html\s*/, '');
        
        // Remove ``` at the end
        cleanPlan = cleanPlan.replace(/\s*```\s*$/, '');
        
        // Remove any remaining code block markers
        cleanPlan = cleanPlan.replace(/```[\w]*\s*/g, '').replace(/```\s*/g, '');
        
        setDietPlan(cleanPlan);
      } else {
        throw new Error(data.message || 'Failed to generate diet plan');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      setDietPlan({
        error: true,
        message: "Sorry, I'm having trouble generating your diet plan right now. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setUserInput(example.prompt);
    setSelectedExample(example.title);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateDietPlan();
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-green-600 mr-2" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                AyuChart
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get personalized Ayurvedic nutrition recommendations
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="max-w-4xl mx-auto">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your dietary needs, health goals, allergies, age, activity level, Prakriti (constitution)..."
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-green-500 transition-all text-gray-700 placeholder-gray-400"
                disabled={loading}
              />
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">Press Enter to send, Shift+Enter for new line</span>
              </div>
              
              {/* Generate Plan Button */}
              <div className="text-center mt-6">
                <button
                  onClick={generateDietPlan}
                  disabled={loading || !userInput.trim()}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-4 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed mx-auto text-lg"
                >
                  {loading ? (
                    <>
                      <Loader className="w-6 h-6 animate-spin" />
                      <span>Generating Your Personalized Plan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      <span>Generate Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="mb-8">
            <p className="text-center text-gray-600 mb-6">Or try one of these examples:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-md text-left ${
                    selectedExample === example.title
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {example.icon}
                    <h3 className="font-semibold text-gray-800 ml-2">{example.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{example.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Results Section */}
          {dietPlan && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {dietPlan.error ? (
                <div className="p-8 text-center">
                  <div className="text-red-500 mb-4">
                    <Heart className="w-12 h-12 mx-auto mb-2" />
                  </div>
                  <p className="text-gray-600">{dietPlan.message}</p>
                </div>
              ) : (
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <Sparkles className="w-6 h-6 text-green-600 mr-2" />
                    <h2 className="text-2xl font-bold text-gray-800">Your Personalized Ayurvedic Diet Plan</h2>
                  </div>
                  
                  <div className="prose prose-lg max-w-none">
                    <div 
                      className="ayurveda-diet-content text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: dietPlan }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default AyuChart;
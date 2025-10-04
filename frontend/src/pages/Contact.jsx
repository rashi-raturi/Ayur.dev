import React, { useEffect } from 'react';
import { Mic, Brain, Sparkles } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function ContactWithOmniEnv() {
  // Vite exposes env vars prefixed with VITE_ via import.meta.env
  const secret = import.meta.env.VITE_OMNI_SECRET_KEY || "";

  // Load OmniDimension widget script
  useEffect(() => {
    if (secret) {
      const script = document.createElement('script');
      script.async = true;
      script.id = 'omnidimension-web-widget';
      script.src = `https://backend.omnidim.io/web_widget.js?secret_key=${secret}`;
      document.body.appendChild(script);

      return () => {
        // Cleanup script when component unmounts
        const existingScript = document.getElementById('omnidimension-web-widget');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  }, [secret]);

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          <div className="flex flex-col space-y-6">
            <div className="text-center py-8 md:py-16">
              {/* Vaani AI Title */}
              <div className="mb-8">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4">Vaani AI</h1>
                <p className="text-xl md:text-2xl text-gray-600">Your Ayurveda-inspired voice assistant</p>
              </div>
              
              {/* Main Content Card */}
              <div className="max-w-4xl mx-auto mb-10">
                <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    {/* Title Section */}
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Meet Vaani AI
                      </h2>
                      <p className="text-gray-600 leading-relaxed">
                        Your intelligent assistant designed to bring the essence of Ayurveda into modern life through natural voice interactions.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-center">
                    <button 
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl"
                      onClick={() => {
                        // Trigger the OmniDimension widget
                        if (window.omnidimension && window.omnidimension.open) {
                          window.omnidimension.open();
                        }
                      }}
                    >
                      <Mic className="w-5 h-5" />
                      Start Voice Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature Options - Exact AyuChart sizing */}
              <div className="max-w-5xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-700 mb-6">Explore Vaani AI capabilities:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="group p-6 text-center bg-white border-2 border-purple-100 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:bg-purple-200 transition-colors">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-2">Ayurveda Knowledge</div>
                    <div className="text-sm text-gray-600">Natural remedies, yoga, and lifestyle guidance</div>
                  </div>

                  <div className="group p-6 text-center bg-white border-2 border-purple-100 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:bg-purple-200 transition-colors">
                      <Mic className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-2">Voice Interaction</div>
                    <div className="text-sm text-gray-600">Hands-free, natural conversations</div>
                  </div>

                  <div className="group p-6 text-center bg-white border-2 border-purple-100 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:bg-purple-200 transition-colors">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-2">Modern Wisdom</div>
                    <div className="text-sm text-gray-600">Ancient knowledge meets AI technology</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            Powered by OmniDimension • Crafted with the wisdom of Ayurveda 🌿
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
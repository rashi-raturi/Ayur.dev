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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="pt-16 pb-8">
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-gray-900 mb-4">Vaani AI</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Your Ayurveda-inspired voice-based AI assistant — blending ancient wisdom with modern conversations.
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
            <div className="p-12">
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                  Meet Vaani AI
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Vaani AI is your intelligent assistant designed to bring the essence of Ayurveda into modern life. 
                  Whether you want to learn natural wellness tips, explore holistic practices, or simply experience 
                  smooth voice interactions, Vaani AI is here to guide you.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {/* Ayurveda Knowledge */}
                <div className="border border-blue-100 hover:shadow-lg transition-all duration-300 hover:border-blue-200 rounded-xl">
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      🌱 Ayurveda Knowledge
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Get insights into natural remedies, yoga, diet, and lifestyle balance.
                    </p>
                  </div>
                </div>

                {/* Voice Interaction */}
                <div className="border border-blue-100 hover:shadow-lg transition-all duration-300 hover:border-blue-200 rounded-xl">
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      🎤 Voice Interaction
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Talk naturally with Vaani AI using voice — hands-free and effortless.
                    </p>
                  </div>
                </div>

                {/* Modern + Ancient */}
                <div className="border border-blue-100 hover:shadow-lg transition-all duration-300 hover:border-blue-200 rounded-xl">
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      ✨ Modern + Ancient
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Seamlessly blends ancient Ayurvedic wisdom with modern AI capabilities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Place your first call. Check out Vaani AI 👋
                </p>
                <button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold"
                  onClick={() => {
                    // Trigger the OmniDimension widget
                    if (window.omnidimension && window.omnidimension.open) {
                      window.omnidimension.open();
                    }
                  }}
                >
                  🎙️ Vaani AI
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Button (floating) */}
        <div className="fixed bottom-6 right-6">
          <button 
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center"
            onClick={() => {
              // Trigger the OmniDimension widget
              if (window.omnidimension && window.omnidimension.open) {
                window.omnidimension.open();
              }
            }}
          >
            <div className="relative">
              <Mic className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
          </button>
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
import React from 'react';

const AILoadingModal = ({ isOpen, message = "AI is generating your diet chart..." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        {/* AI Icon Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="w-24 h-24 rounded-full border-4 border-gray-200 border-t-black animate-spin"></div>
            
            {/* Inner pulsing circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center animate-pulse">
                <svg 
                  className="w-8 h-8 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {message}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            This may take 10-30 seconds
          </p>
          
          {/* Progress indicators */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Analyzing patient profile...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200"></div>
              <span>Searching relevant foods...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-400"></div>
              <span>Creating personalized meals...</span>
            </div>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
        </div>

        {/* Tip */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600 text-center">
            💡 <strong>Pro tip:</strong> AI is considering {" "}
            <span className="text-black font-medium">8000+ foods</span> to find the perfect match for your patient's needs
          </p>
        </div>
      </div>
    </div>
  );
};

export default AILoadingModal;

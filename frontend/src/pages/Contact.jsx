import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Loader, Sparkles, Brain, Heart, Leaf, Volume2, X, MessageCircle, Send } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import geminiLiveService from '../services/geminiLiveService';
import { blobToBase64 } from '../utils/audioUtils';

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Cache utility functions
const CACHE_KEYS = {
  MESSAGES: 'vaani_ai_messages',
  AUDIO_CACHE: 'vaani_ai_audio_cache'
};

const saveMessagesToCache = (messages) => {
  try {
    // Convert messages to cacheable format (remove blob URLs, keep audio data)
    const cacheableMessages = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
      // Remove blob URLs as they're not serializable
      audioUrl: undefined
    }));
    localStorage.setItem(CACHE_KEYS.MESSAGES, JSON.stringify(cacheableMessages));
  } catch (error) {
    console.warn('Failed to save messages to cache:', error);
  }
};

const loadMessagesFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.MESSAGES);
    if (cached) {
      const messages = JSON.parse(cached);
      // Convert timestamp strings back to Date objects
      return messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
  } catch (error) {
    console.warn('Failed to load messages from cache:', error);
  }
  return [];
};

const saveAudioToCache = async (messageId, audioBlob) => {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    const audioCache = JSON.parse(localStorage.getItem(CACHE_KEYS.AUDIO_CACHE) || '{}');
    audioCache[messageId] = base64Audio;
    localStorage.setItem(CACHE_KEYS.AUDIO_CACHE, JSON.stringify(audioCache));
  } catch (error) {
    console.warn('Failed to save audio to cache:', error);
  }
};

const loadAudioFromCache = (messageId) => {
  try {
    const audioCache = JSON.parse(localStorage.getItem(CACHE_KEYS.AUDIO_CACHE) || '{}');
    const base64Audio = audioCache[messageId];
    if (base64Audio) {
      // Convert base64 back to blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.warn('Failed to load audio from cache:', error);
  }
  return null;
};

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.MESSAGES);
    localStorage.removeItem(CACHE_KEYS.AUDIO_CACHE);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

export default function Contact() {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Choose voice or chat to begin');
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [activeMode, setActiveMode] = useState(null); // 'voice' or 'chat'
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textInputRef = useRef(null);
  const currentAudioRef = useRef(null);
  
  const apiKey = (import.meta.env.VITE_GEMINI_LIVE_API_KEY || "").trim();

  // Load cached messages on component mount
  useEffect(() => {
    const cachedMessages = loadMessagesFromCache();
    if (cachedMessages.length > 0) {
      // Load audio URLs for messages that had audio
      const messagesWithAudio = cachedMessages.map(msg => {
        if (msg.audioBlob && msg.id) {
          const audioUrl = loadAudioFromCache(msg.id);
          return {
            ...msg,
            audioUrl
          };
        }
        return msg;
      });
      setMessages(messagesWithAudio);
      setStatusMessage('💬 Chat history loaded from cache');
    }
  }, []);

  // Save messages to cache whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToCache(messages);
    }
  }, [messages]);

  // Debug: Log API key status
  useEffect(() => {
    if (!apiKey) {
      setStatusMessage('⚠️ Gemini API key not configured. Please add VITE_GEMINI_LIVE_API_KEY to your .env file');
    }

    return () => {
      if (geminiLiveService.getIsConnected()) {
        geminiLiveService.disconnect();
      }
      stopRecording();
    };
  }, [apiKey]);

  // Connect to Gemini Live API
  const connectToGemini = async () => {
    if (!apiKey) {
      setStatusMessage('❌ API key is required');
      return false;
    }

    try {
      setIsConnecting(true);
      setStatusMessage('Connecting to Vaani AI...');

      await geminiLiveService.connect(apiKey, {
        onConnect: () => {
          setIsConnected(true);
          setStatusMessage('✅ Connected! Choose your input method...');
          console.log('Connected to Gemini Live');
          const messageId = `msg_${Date.now()}_${Math.random()}`;
          setMessages(prev => [...prev, { 
            id: messageId,
            type: 'connected', 
            timestamp: new Date()
          }]);
        },
        onDisconnect: () => {
          setIsConnected(false);
          setIsListening(false);
          setActiveMode(null);
          setStatusMessage('Disconnected from Vaani AI');
          const messageId = `msg_${Date.now()}_${Math.random()}`;
          setMessages(prev => [...prev, { 
            id: messageId,
            type: 'disconnected',
            timestamp: new Date()
          }]);
        },
        onTextResponse: (text) => {
          console.log('Text response received:', text);
          // Don't render text response - only used for audio generation
          setStatusMessage('✅ Response received');
          setIsSending(false);
        },
        onAudioResponse: (audioBlob) => {
          console.log('Audio response received, blob size:', audioBlob.size);
          setStatusMessage('🔊 Playing audio response...');
          
          // Remove loading message and add speaking indicator
          setMessages(prev => {
            const newMessages = [...prev];
            const loadingIndex = newMessages.findLastIndex(msg => msg.type === 'loading');
            if (loadingIndex !== -1) {
              newMessages.splice(loadingIndex, 1); // Remove loading message
            }
            
            // Add speaking message
            const messageId = `msg_${Date.now()}_${Math.random()}`;
            newMessages.push({
              id: messageId,
              type: 'speaking',
              audioBlob: audioBlob,
              audioUrl: URL.createObjectURL(audioBlob),
              timestamp: new Date()
            });
            
            // Cache the audio
            saveAudioToCache(messageId, audioBlob);
            return newMessages;
          });
          
          // Play audio and track state
          setIsAudioPlaying(true);
          const audio = new Audio(URL.createObjectURL(audioBlob));
          currentAudioRef.current = audio;
          
          audio.onended = () => {
            setIsAudioPlaying(false);
            setStatusMessage('✅ Response complete');
            setIsAiResponding(false);
            currentAudioRef.current = null;
          };
          
          audio.onerror = () => {
            setIsAudioPlaying(false);
            setStatusMessage('❌ Audio playback error');
            setIsAiResponding(false);
            currentAudioRef.current = null;
          };
          
          audio.play().catch(error => {
            console.error('Error playing audio:', error);
            setIsAudioPlaying(false);
            setStatusMessage('❌ Audio playback error');
            setIsAiResponding(false);
          });
        },
        onError: (error) => {
          console.error('Gemini error:', error);
          
          // Disconnect on error with detailed message
          setIsConnected(false);
          setIsListening(false);
          setIsSending(false);
          setIsAiResponding(false);
          setStatusMessage(`❌ Disconnected due to error`);
          
          // Disconnect from service
          geminiLiveService.disconnect();
          
          // Replace loading message with error disconnect message
          setMessages(prev => {
            const newMessages = [...prev];
            const loadingIndex = newMessages.findLastIndex(msg => msg.type === 'loading');
            if (loadingIndex !== -1) {
              newMessages.splice(loadingIndex, 1); // Remove loading message
            }
            
            const messageId = `msg_${Date.now()}_${Math.random()}`;
            newMessages.push({ 
              id: messageId,
              type: 'error-disconnect', 
              errorMessage: error.message || 'Unknown error occurred',
              timestamp: new Date()
            });
            
            return newMessages;
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to connect:', error);
      setStatusMessage(`❌ Connection failed: ${error.message}`);
      setIsConnected(false);
      setIsSending(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Start recording audio from microphone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000
        } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const base64Audio = await blobToBase64(audioBlob);
          setStatusMessage('📤 Sending audio...');
          const messageId = `msg_${Date.now()}_${Math.random()}`;
          setMessages(prev => [...prev, { 
            id: messageId,
            type: 'user', 
            text: '🎤 Audio message',
            timestamp: new Date()
          }]);

          // Add loading message
          setMessages(prev => [...prev, { 
            type: 'loading', 
            text: '',
            timestamp: new Date()
          }]);

          setIsAiResponding(true);
          await geminiLiveService.sendAudio(base64Audio, 'audio/webm');
          setStatusMessage('⏳ Waiting for response...');
        } catch (error) {
          console.error('Error sending audio:', error);
          setStatusMessage(`❌ Failed to send audio: ${error.message}`);
          const messageId = `msg_${Date.now()}_${Math.random()}`;
          setMessages(prev => [...prev, { 
            id: messageId,
            type: 'error', 
            text: `Failed to send audio: ${error.message}`,
            timestamp: new Date()
          }]);
          setIsAiResponding(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setActiveMode('voice');
      setStatusMessage('🎤 Listening... Speak now');
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatusMessage(`❌ Microphone error: ${error.message}`);
      const messageId = `msg_${Date.now()}_${Math.random()}`;
      setMessages(prev => [...prev, { 
        id: messageId,
        type: 'error', 
        text: `Microphone error: ${error.message}`,
        timestamp: new Date()
      }]);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsListening(false);
    setStatusMessage(isConnected ? '✅ Connected. Choose voice or chat.' : 'Ready to start');
    console.log('Recording stopped');
  };

  // Handle voice button click
  const handleVoiceClick = async () => {
    if (!isConnected) {
      const connected = await connectToGemini();
      if (connected) {
        setTimeout(() => startRecording(), 500);
      }
    } else if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle text message send
  const handleSendText = async () => {
    if (!textInput.trim() || isSending || isAiResponding) return;

    const messageText = textInput.trim();
    setTextInput('');
    
    if (!isConnected) {
      const connected = await connectToGemini();
      if (!connected) return;
    }

    try {
      setIsSending(true);
      setIsAiResponding(true);
      setActiveMode('chat');
      setStatusMessage('📤 Sending message...');
      
      const userMessageId = `msg_${Date.now()}_${Math.random()}`;
      setMessages(prev => [...prev, { 
        id: userMessageId,
        type: 'user', 
        text: messageText,
        timestamp: new Date()
      }]);

      // Add loading message
      const loadingMessageId = `msg_${Date.now() + 1}_${Math.random()}`;
      setMessages(prev => [...prev, { 
        id: loadingMessageId,
        type: 'loading', 
        text: '',
        timestamp: new Date()
      }]);

      await geminiLiveService.sendText(messageText);
      setStatusMessage('⏳ Waiting for response...');
    } catch (error) {
      console.error('Error sending text:', error);
      setStatusMessage(`❌ Failed to send message: ${error.message}`);
      const messageId = `msg_${Date.now()}_${Math.random()}`;
      setMessages(prev => [...prev, { 
        id: messageId,
        type: 'error', 
        text: `Failed to send message: ${error.message}`,
        timestamp: new Date()
      }]);
      setIsSending(false);
      setIsAiResponding(false);
    }
  };

  // Handle Enter key in text input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Disconnect from Gemini
  const handleDisconnect = () => {
    stopRecording();
    geminiLiveService.disconnect();
    setIsConnected(false);
    setIsListening(false);
    // Don't clear messages - preserve chat history
    // Add disconnect message to history
    const messageId = `msg_${Date.now()}_${Math.random()}`;
    setMessages(prev => [...prev, { 
      id: messageId,
      type: 'disconnected',
      timestamp: new Date()
    }]);
    setTextInput('');
    setActiveMode(null);
    setIsAiResponding(false);
    setStatusMessage('Disconnected. Choose voice or chat to begin again.');
    // Don't clear cache - history is preserved
  };

  // Typing animation component - Futuristic animated ring
  const AnimatedRing = () => (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-500 border-r-green-400 animate-spin"></div>
        {/* Middle ring */}
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-emerald-500 border-l-emerald-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        {/* Inner pulse */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse"></div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );

  // Speaking indicator - Black futuristic animated ring
  const SpeakingIndicator = ({ isPlaying = false }) => (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-24 h-24">
        {/* Outer rotating ring - black - only animate when playing */}
        <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-gray-900 border-r-gray-800 ${isPlaying ? 'animate-spin' : ''}`}></div>
        {/* Middle ring - reverse rotation - only animate when playing */}
        <div className={`absolute inset-2 rounded-full border-4 border-transparent border-b-gray-700 border-l-gray-600 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
        {/* Inner ring - fast rotation - only animate when playing */}
        <div className={`absolute inset-4 rounded-full border-3 border-transparent border-t-gray-500 border-r-gray-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '1s' }}></div>
        {/* Center pulse - only animate when playing */}
        <div className={`absolute inset-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 ${isPlaying ? 'animate-pulse' : ''}`}></div>
        {/* Sound wave effect - only show when playing */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mt-4 font-medium">
        {isPlaying ? '🎙️ Vaani AI is speaking...' : '✅ Audio ready to replay'}
      </p>
    </div>
  );

  // Loading indicator - Nice inline UI
  const LoadingIndicator = () => (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
        
        {/* Loading content */}
        <div className="relative bg-white rounded-2xl px-8 py-6 shadow-xl border-2 border-gray-100">
          <div className="flex items-center gap-4">
            {/* Spinner */}
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-green-500 border-r-emerald-500 animate-spin"></div>
              <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-green-400 border-l-emerald-400 animate-spin" style={{ animationDirection: 'reverse' }}></div>
            </div>
            
            {/* Text */}
            <div>
              <p className="text-base font-semibold text-gray-800">Processing your request</p>
              <p className="text-sm text-gray-500">Vaani AI is thinking...</p>
            </div>
          </div>
          
          {/* Animated dots */}
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Replay audio message
  const replayAudio = async (audioUrl) => {
    try {
      // Stop current audio if playing
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      setIsAudioPlaying(true);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsAudioPlaying(false);
        currentAudioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsAudioPlaying(false);
        currentAudioRef.current = null;
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error replaying audio:', error);
      setIsAudioPlaying(false);
    }
  };

  // Connected status message - Modern UI
  const ConnectedMessage = () => (
    <div className="flex justify-center my-6">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
        
        {/* Main card */}
        <div className="relative bg-white rounded-2xl px-8 py-4 shadow-lg border-2 border-green-200">
          <div className="flex items-center gap-4">
            {/* Animated check icon */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            {/* Text */}
            <div>
              <p className="text-lg font-bold text-gray-900">Connected to Vaani AI</p>
              <p className="text-sm text-gray-600">Ready to assist you with Ayurvedic wisdom</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Disconnected status message - Modern UI
  const DisconnectedMessage = () => (
    <div className="flex justify-center my-6">
      <div className="relative">
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-gray-300 rounded-2xl blur-xl opacity-20"></div>
        
        {/* Main card */}
        <div className="relative bg-white rounded-2xl px-8 py-4 shadow-lg border-2 border-gray-200">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            {/* Text */}
            <div>
              <p className="text-lg font-bold text-gray-700">Disconnected</p>
              <p className="text-sm text-gray-500">Session ended successfully</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Error disconnect message - Modern UI with explanation
  const ErrorDisconnectMessage = ({ errorMessage }) => (
    <div className="flex justify-center my-6">
      <div className="relative max-w-xl">
        {/* Red glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
        
        {/* Main card */}
        <div className="relative bg-white rounded-2xl px-8 py-5 shadow-xl border-2 border-red-200">
          <div className="flex items-start gap-4">
            {/* Warning icon */}
            <div className="flex-shrink-0">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-20"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Text content */}
            <div className="flex-1">
              <p className="text-lg font-bold text-red-900 mb-1">Connection Error</p>
              <p className="text-sm text-gray-700 mb-3">The connection to Vaani AI was interrupted</p>
              
              {/* Error details */}
              <div className="bg-red-50 rounded-lg px-4 py-3 border border-red-100">
                <p className="text-xs font-semibold text-red-800 mb-1">Error Details:</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
              
              {/* Action hint */}
              <p className="text-xs text-gray-500 mt-3">
                💡 Try reconnecting using the voice or chat button
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-xl">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Vaani AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Your intelligent Ayurvedic assistant — Chat or speak naturally
            </p>
          </div>

          {/* Main Chat Interface */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              
              {/* Status Bar */}
              <div className="bg-gradient-to-r from-green-100 to-blue-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isConnecting ? (
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : isConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-green-700">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3 bg-gray-400 rounded-full"></span>
                        <span className="text-sm font-semibold text-gray-600">Offline</span>
                      </div>
                    )}
                    <span className="text-sm text-gray-600">
                      {isAiResponding ? '🤔 Vaani AI is crafting your response...' : statusMessage}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {isConnected && (
                      <button
                        onClick={handleDisconnect}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium shadow hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <X className="w-4 h-4" />
                        Disconnect
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMessages([]);
                        clearCache();
                        setStatusMessage('🗑️ Chat history cleared');
                      }}
                      disabled={messages.length === 0}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium shadow hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear History
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="bg-gray-50 p-6 h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageCircle className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start a conversation using voice or chat</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-center'}`}
                      >
                        {msg.type === 'loading' ? (
                          <LoadingIndicator />
                        ) : msg.type === 'speaking' ? (
                          <div className="w-full flex flex-col items-center">
                            <SpeakingIndicator isPlaying={isAudioPlaying} />
                            {/* Audio replay button */}
                            {msg.audioUrl && (
                              <button
                                onClick={() => replayAudio(msg.audioUrl)}
                                disabled={isAudioPlaying}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Volume2 className="w-4 h-4" />
                                Replay Audio
                              </button>
                            )}
                          </div>
                        ) : msg.type === 'connected' ? (
                          <ConnectedMessage />
                        ) : msg.type === 'disconnected' ? (
                          <DisconnectedMessage />
                        ) : msg.type === 'error-disconnect' ? (
                          <ErrorDisconnectMessage errorMessage={msg.errorMessage} />
                        ) : msg.type === 'user' ? (
                          <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <p className="text-xs mt-1 text-green-100">
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        ) : (
                          <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-blue-100 text-blue-900 border border-blue-200 text-center">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <p className="text-xs mt-1 text-gray-500">
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end gap-3">
                  {/* Voice Button */}
                  <button
                    onClick={handleVoiceClick}
                    disabled={isConnecting || !apiKey || isSending || isAiResponding}
                    className={`flex-shrink-0 p-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    } text-white`}
                  >
                    {isConnecting ? (
                      <Loader className="w-6 h-6 animate-spin" />
                    ) : isListening ? (
                      <div className="relative">
                        <MicOff className="w-6 h-6" />
                      </div>
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>

                  {/* Text Input */}
                  <div className="flex-1 flex gap-3">
                    <textarea
                      ref={textInputRef}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isConnected ? "Type your message..." : "Connect to start chatting..."}
                      disabled={!apiKey || isListening || isAiResponding}
                      rows="1"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ minHeight: '52px', maxHeight: '120px' }}
                    />
                    
                    <button
                      onClick={handleSendText}
                      disabled={!textInput.trim() || isSending || !apiKey || isListening || isAiResponding}
                      className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSending ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mode Indicators */}
                {activeMode && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    {activeMode === 'voice' ? (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Voice mode active</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat mode active</span>
                      </>
                    )}
                  </div>
                )}

                {/* Tips */}
                {!isConnected && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center mb-2">
                      <span className="font-semibold">💡 Quick Tips:</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        Click mic for voice
                      </span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        Type to chat
                      </span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        Press Enter to send
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              What Vaani AI Can Do
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                  <Leaf className="w-7 h-7 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Ayurvedic Guidance</h4>
                <p className="text-sm text-gray-600">
                  Get personalized advice based on ancient Ayurvedic principles
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Natural Remedies</h4>
                <p className="text-sm text-gray-600">
                  Discover herbal treatments and natural healing methods
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-7 h-7 text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Wellness Tips</h4>
                <p className="text-sm text-gray-600">
                  Daily routines, yoga poses, and lifestyle recommendations
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-pink-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Voice & Chat</h4>
                <p className="text-sm text-gray-600">
                  Interact naturally through voice or text conversation
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-16">
            <p className="text-sm text-gray-500">
              Powered by Google Gemini Live • Crafted with Ayurvedic wisdom 🌿
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

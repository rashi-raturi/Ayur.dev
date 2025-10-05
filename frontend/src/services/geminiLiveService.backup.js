/**
 * Gemini Live API Service for real-time voice chat
 * Handles WebSocket connection, audio streaming, and response handling
 */

import { GoogleGenAI, Modality, MediaResolution } from '@google/genai';
import { convertToWav, playAudio } from '../utils/audioUtils';

class GeminiLiveService {
  constructor() {
    this.session = null;
    this.responseQueue = [];
    this.audioParts = [];
    this.textParts = []; // Track text parts separately
    this.isConnected = false;
    this.callbacks = {
      onMessage: null,
      onAudioResponse: null,
      onTextResponse: null,
      onError: null,
      onConnect: null,
      onDisconnect: null,
    };
  }

  /**
   * Initialize and connect to Gemini Live API
   * @param {string} apiKey - Gemini API key
   * @param {Object} callbacks - Event callbacks
   */
  async connect(apiKey, callbacks = {}) {
    try {
      this.callbacks = { ...this.callbacks, ...callbacks };

      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      const model = 'models/gemini-2.0-flash-exp';

      const config = {
        generationConfig: {
          responseModalities: 'audio',
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Puck',
              }
            }
          }
        }
      };

      this.session = await ai.live.connect({
        model,
        config
      });

      // Set up event listeners
      this.session.on('open', () => {
        console.log('Gemini Live: Connected');
        this.isConnected = true;
        if (this.callbacks.onConnect) {
          this.callbacks.onConnect();
        }
      });

      this.session.on('message', (message) => {
        this.responseQueue.push(message);
        this.handleMessage(message);
      });

      this.session.on('error', (e) => {
        console.error('Gemini Live Error:', e);
        if (this.callbacks.onError) {
          this.callbacks.onError(e);
        }
      });

      this.session.on('close', (e) => {
        console.log('Gemini Live: Disconnected', e);
        this.isConnected = false;
        if (this.callbacks.onDisconnect) {
          this.callbacks.onDisconnect(e);
        }
      });

      return this.session;
    } catch (error) {
      console.error('Failed to connect to Gemini Live:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Handle incoming messages from Gemini
   * @param {Object} message - Server message
   */
  handleMessage(message) {
    console.log('Received message from Gemini:', message);
    
    if (this.callbacks.onMessage) {
      this.callbacks.onMessage(message);
    }

    // Handle server content
    if (message.serverContent) {
      const serverContent = message.serverContent;

      // Handle model turn with parts
      if (serverContent.modelTurn && serverContent.modelTurn.parts) {
        const parts = serverContent.modelTurn.parts;

        // Process all parts
        parts.forEach(part => {
          // Handle text response
          if (part.text) {
            console.log('Gemini text response:', part.text);
            this.textParts.push(part.text);
          }

          // Handle inline audio data
          if (part.inlineData) {
            console.log('Gemini audio response received, MIME:', part.inlineData.mimeType);
            this.audioParts.push(part.inlineData.data || '');
          }
        });
      }

      // Check if turn is complete
      if (serverContent.turnComplete) {
        console.log('Turn complete');
        
        // Send accumulated text if any
        if (this.textParts.length > 0) {
          const fullText = this.textParts.join('');
          console.log('Full text response:', fullText);
          if (this.callbacks.onTextResponse) {
            this.callbacks.onTextResponse(fullText);
          }
          this.textParts = [];
        }
        
        // Convert and play accumulated audio if any
        if (this.audioParts.length > 0) {
          try {
            const audioBlob = convertToWav(this.audioParts, 'audio/pcm;rate=24000');
            
            if (this.callbacks.onAudioResponse) {
              this.callbacks.onAudioResponse(audioBlob);
            }

            playAudio(audioBlob).then(() => {
              console.log('Audio playback completed');
            }).catch(err => {
              console.error('Error playing audio:', err);
            });
          } catch (err) {
            console.error('Error converting audio:', err);
          }
          this.audioParts = [];
        }
      }
    }
  }

  /**
   * Send text message to Gemini
   * @param {string} text - Text message
   */
  async sendText(text) {
    if (!this.session || !this.isConnected) {
      throw new Error('Not connected to Gemini Live');
    }

    try {
      console.log('Sending text to Gemini:', text);
      await this.session.send({
        client_content: {
          turns: [{
            role: 'user',
            parts: [{ text: text }]
          }],
          turn_complete: true
        }
      });
    } catch (error) {
      console.error('Error sending text:', error);
      throw error;
    }
  }

  /**
   * Send audio data to Gemini
   * @param {string} audioData - Base64 encoded audio
   * @param {string} mimeType - Audio MIME type
   */
  async sendAudio(audioData, mimeType = 'audio/webm') {
    if (!this.session || !this.isConnected) {
      throw new Error('Not connected to Gemini Live');
    }

    try {
      console.log('Sending audio to Gemini, size:', audioData.length, 'MIME:', mimeType);
      await this.session.send({
        client_content: {
          turns: [{
            role: 'user',
            parts: [{
              inline_data: {
                mime_type: mimeType,
                data: audioData
              }
            }]
          }],
          turn_complete: true
        }
      });
    } catch (error) {
      console.error('Error sending audio:', error);
      throw error;
    }
  }

  /**
   * Wait for a complete turn (response) from Gemini
   * @returns {Promise<Array>} Array of messages in the turn
   */
  async handleTurn() {
    const turn = [];
    let done = false;

    while (!done) {
      const message = await this.waitMessage();
      turn.push(message);
      if (message.serverContent?.turnComplete) {
        done = true;
      }
    }

    return turn;
  }

  /**
   * Wait for next message from queue
   * @returns {Promise<Object>} Next message
   */
  async waitMessage() {
    let message;
    while (!message) {
      message = this.responseQueue.shift();
      if (!message) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  /**
   * Disconnect from Gemini Live
   */
  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
      this.isConnected = false;
      this.responseQueue = [];
      this.audioParts = [];
      this.textParts = [];
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  getIsConnected() {
    return this.isConnected;
  }
}

// Export singleton instance
export default new GeminiLiveService();

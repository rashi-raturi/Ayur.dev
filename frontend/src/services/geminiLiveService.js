import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality } from '@google/genai';

class GeminiLiveService {
    constructor() {
        this.session = null;
        this.responseQueue = [];
        this.audioParts = [];
        this.currentText = '';
        this.currentAudioParts = [];
        this.isConnected = false;
        this.keepAliveInterval = null;
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
     * Start keep-alive mechanism
     */
    startKeepAlive() {
        this.stopKeepAlive(); // Clear any existing interval
        this.keepAliveInterval = setInterval(() => {
            if (this.session && this.isConnected) {
                try {
                    // Send a session management message to keep connection alive
                    this.session.sendClientContent({
                        turns: [],
                        turnComplete: false
                    });
                } catch (error) {
                    console.warn('Keep-alive failed:', error);
                }
            }
        }, 30000); // Send keep-alive every 30 seconds
    }

    /**
     * Stop keep-alive mechanism
     */
    stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
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

            const model = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

            const config = {
                responseModalities: [Modality.AUDIO],
                mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Aoede',
                        }
                    }
                },
                contextWindowCompression: {
                    triggerTokens: '25600',
                    slidingWindow: { targetTokens: '12800' },
                },
                systemInstruction: {
                    parts: [{
                        text: `You are Vaani AI, a compassionate and knowledgeable Ayurvedic wellness assistant. Your purpose is to guide people toward holistic health and well-being using ancient Ayurvedic wisdom adapted for modern life.

                        🌿 Your Core Principles
                        Holistic Approach: Address mind, body, and spirit as interconnected
                        Prevention First: Emphasize daily routines and lifestyle over quick fixes
                        Natural Wisdom: Prioritize herbal remedies, diet, and natural healing methods
                        Personalized Guidance: Consider individual constitution (dosha), age, season, and lifestyle
                        Evidence-Based Tradition: Combine time-tested Ayurvedic knowledge with modern understanding
                        🧘 Your Areas of Expertise
                        Ayurvedic Guidance
                        Explain doshas (Vata, Pitta, Kapha) and how they affect health
                        Help users identify their prakriti (natural constitution)
                        Provide personalized recommendations based on individual balance
                        Guide through Ayurvedic daily routines (dinacharya) and seasonal routines (ritucharya)
                        Natural Remedies
                        Recommend herbal treatments and formulations
                        Suggest dietary changes and food combinations
                        Advise on natural detoxification methods
                        Share traditional healing practices and home remedies
                        Wellness Tips
                        Daily routine recommendations (waking, eating, sleeping times)
                        Yoga poses and breathing exercises (pranayama)
                        Meditation and mindfulness practices
                        Lifestyle modifications for better health
                        Seasonal wellness practices
                        Voice & Chat Interaction
                        Respond naturally to both spoken and written queries
                        Use warm, encouraging language
                        Ask clarifying questions when needed
                        Provide step-by-step guidance
                        Encourage gradual, sustainable changes
                        ⚖️ Important Guidelines
                        Safety & Ethics
                        Always recommend consulting healthcare professionals for serious conditions
                        Never diagnose medical conditions or replace professional medical advice
                        Be transparent about limitations of Ayurvedic approaches
                        Respect individual health conditions and medications
                        Promote sustainable, long-term wellness over quick fixes
                        Response Style
                        Warm & Approachable: Use friendly, encouraging language
                        Educational: Explain Ayurvedic concepts clearly
                        Practical: Provide actionable, realistic advice
                        Balanced: Combine tradition with modern sensibility
                        Empowering: Help users take charge of their wellness journey
                        Communication Approach
                        Start with empathy and understanding
                        Use simple language while maintaining authenticity
                        Provide context for recommendations
                        Suggest gradual implementation
                        End with encouragement and follow-up questions
                        🚫 Boundaries
                        Do not provide medical diagnoses
                        Avoid emergency medical advice
                        Do not recommend discontinuing prescribed medications
                        Respect cultural and religious sensitivities
                        Stay within Ayurvedic and natural wellness scope
                        💝 Your Voice
                        You speak with the wisdom of ancient traditions and the warmth of a caring friend. You bridge timeless Ayurvedic knowledge with modern wellness needs, always prioritizing the individual's unique path to health and harmony. You speak with a North Indian accent.`,
                    }]
                }
            };

            this.session = await ai.live.connect({
                model,
                callbacks: {
                    onopen: () => {
                        console.log('Gemini Live: Connected');
                        this.isConnected = true;
                        this.startKeepAlive();
                        if (this.callbacks.onConnect) {
                            this.callbacks.onConnect();
                        }
                    },
                    onmessage: (message) => {
                        try {
                            console.log('Received message from Gemini:', message);
                            this.responseQueue.push(message);
                            this.handleModelTurn(message);
                        } catch (error) {
                            console.error('Error handling message:', error);
                            if (this.callbacks.onError) {
                                this.callbacks.onError(error);
                            }
                        }
                    },
                    onerror: (e) => {
                        console.error('Gemini Live Error:', e);
                        if (this.callbacks.onError) {
                            this.callbacks.onError(e);
                        }
                    },
                    onclose: (e) => {
                        console.log('Gemini Live: Disconnected', e);
                        this.isConnected = false;
                        this.stopKeepAlive();
                        if (this.callbacks.onDisconnect) {
                            this.callbacks.onDisconnect(e);
                        }
                    },
                },
                config
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
     * Handle model turn from server message
     * @param {LiveServerMessage} message - Server message
     */
    handleModelTurn(message) {
        try {
            if (message.serverContent?.modelTurn?.parts) {
                const parts = message.serverContent.modelTurn.parts;

                parts.forEach(part => {
                    // Handle text response
                    if (part.text) {
                        console.log('Gemini text response:', part.text);
                        this.currentText += part.text;
                    }

                    // Handle inline audio data
                    if (part.inlineData) {
                        console.log('Gemini audio response received, MIME:', part.inlineData.mimeType);
                        this.currentAudioParts.push(part.inlineData.data || '');
                    }
                });
            }

            // Check if turn is complete
            if (message.serverContent && message.serverContent.turnComplete) {
                console.log('Turn complete, processing response');

                // Send text response if we have text
                if (this.currentText && this.callbacks.onTextResponse) {
                    this.callbacks.onTextResponse(this.currentText);
                }

                // Send audio response if we have audio
                if (this.currentAudioParts.length > 0) {
                    try {
                        const buffer = this.convertToWav(this.currentAudioParts, 'audio/pcm;rate=24000');
                        const audioBlob = new Blob([buffer], { type: 'audio/wav' });

                        if (this.callbacks.onAudioResponse) {
                            this.callbacks.onAudioResponse(audioBlob);
                        }

                        // Play the audio
                        this.playAudio(audioBlob);
                    } catch (err) {
                        console.error('Error converting audio:', err);
                    }
                }

                // Reset for next turn
                this.currentText = '';
                this.currentAudioParts = [];
            }
        } catch (error) {
            console.error('Error in handleModelTurn:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }

    /**
     * Convert raw audio data to WAV format
     * @param {string[]} rawData - Base64 encoded audio chunks
     * @param {string} mimeType - MIME type of the audio
     * @returns {Uint8Array} WAV formatted audio buffer
     */
    convertToWav(rawData, mimeType) {
        const options = this.parseMimeType(mimeType);
        const dataLength = rawData.reduce((a, b) => a + b.length, 0);
        const wavHeader = this.createWavHeader(dataLength, options);

        // Convert base64 strings to buffers and concatenate
        const audioBuffers = rawData.map(data => Uint8Array.from(atob(data), c => c.charCodeAt(0)));
        const audioBuffer = new Uint8Array(audioBuffers.reduce((acc, buf) => acc + buf.length, 0));

        let offset = 0;
        audioBuffers.forEach(buf => {
            audioBuffer.set(buf, offset);
            offset += buf.length;
        });

        return new Uint8Array([...wavHeader, ...audioBuffer]);
    }

    /**
     * Parse MIME type to get audio format options
     * @param {string} mimeType - MIME type string
     * @returns {Object} Audio format options
     */
    parseMimeType(mimeType) {
        const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
        const [_, format] = fileType.split('/');

        const options = {
            numChannels: 1,
            bitsPerSample: 16,
            sampleRate: 24000, // Default sample rate
        };

        if (format && format.startsWith('L')) {
            const bits = parseInt(format.slice(1), 10);
            if (!isNaN(bits)) {
                options.bitsPerSample = bits;
            }
        }

        for (const param of params) {
            const [key, value] = param.split('=').map(s => s.trim());
            if (key === 'rate') {
                options.sampleRate = parseInt(value, 10);
            }
        }

        return options;
    }

    /**
     * Create WAV file header
     * @param {number} dataLength - Length of audio data
     * @param {Object} options - Audio format options
     * @returns {Uint8Array} WAV header buffer
     */
    createWavHeader(dataLength, options) {
        const { numChannels, sampleRate, bitsPerSample } = options;

        const byteRate = sampleRate * numChannels * bitsPerSample / 8;
        const blockAlign = numChannels * bitsPerSample / 8;
        const buffer = new ArrayBuffer(44);
        const view = new DataView(buffer);

        // RIFF chunk descriptor
        view.setUint8(0, 'R'.charCodeAt(0));
        view.setUint8(1, 'I'.charCodeAt(0));
        view.setUint8(2, 'F'.charCodeAt(0));
        view.setUint8(3, 'F'.charCodeAt(0));
        view.setUint32(4, 36 + dataLength, true); // ChunkSize
        view.setUint8(8, 'W'.charCodeAt(0));
        view.setUint8(9, 'A'.charCodeAt(0));
        view.setUint8(10, 'V'.charCodeAt(0));
        view.setUint8(11, 'E'.charCodeAt(0));

        // fmt sub-chunk
        view.setUint8(12, 'f'.charCodeAt(0));
        view.setUint8(13, 'm'.charCodeAt(0));
        view.setUint8(14, 't'.charCodeAt(0));
        view.setUint8(15, ' '.charCodeAt(0));
        view.setUint32(16, 16, true); // Subchunk1Size (PCM)
        view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
        view.setUint16(22, numChannels, true); // NumChannels
        view.setUint32(24, sampleRate, true); // SampleRate
        view.setUint32(28, byteRate, true); // ByteRate
        view.setUint16(32, blockAlign, true); // BlockAlign
        view.setUint16(34, bitsPerSample, true); // BitsPerSample

        // data sub-chunk
        view.setUint8(36, 'd'.charCodeAt(0));
        view.setUint8(37, 'a'.charCodeAt(0));
        view.setUint8(38, 't'.charCodeAt(0));
        view.setUint8(39, 'a'.charCodeAt(0));
        view.setUint32(40, dataLength, true); // Subchunk2Size

        return new Uint8Array(buffer);
    }

    /**
     * Play audio blob
     * @param {Blob} audioBlob - Audio blob to play
     */
    async playAudio(audioBlob) {
        try {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                console.log('Audio playback completed');
            };
            await audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
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
            console.log('Connection state - session:', !!this.session, 'isConnected:', this.isConnected);

            this.session.sendClientContent({
                turns: [{
                    role: 'user',
                    parts: [{ text: text }]
                }],
                turnComplete: true
            });

            console.log('Text message sent successfully');
            // Response will be handled asynchronously through onmessage callback
        } catch (error) {
            console.error('Error sending text:', error);
            this.isConnected = false; // Mark as disconnected on error
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
            console.log('Connection state - session:', !!this.session, 'isConnected:', this.isConnected);

            this.session.sendClientContent({
                turns: [{
                    role: 'user',
                    parts: [{
                        inlineData: {
                            mimeType: mimeType,
                            data: audioData
                        }
                    }]
                }],
                turnComplete: true
            });

            console.log('Audio message sent successfully');
            // Response will be handled asynchronously through onmessage callback
        } catch (error) {
            console.error('Error sending audio:', error);
            this.isConnected = false; // Mark as disconnected on error
            throw error;
        }
    }

    /**
     * Handle a complete turn (response) from Gemini
     * @returns {Promise<LiveServerMessage[]>} Array of messages in the turn
     */
    async handleTurn() {
        const turn = [];
        let done = false;

        while (!done) {
            const message = await this.waitMessage();
            turn.push(message);
            if (message.serverContent && message.serverContent.turnComplete) {
                done = true;
            }
        }

        return turn;
    }

    /**
     * Wait for next message from queue
     * @returns {Promise<LiveServerMessage>} Next message
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
        this.stopKeepAlive();
        if (this.session) {
            this.session.close();
            this.session = null;
            this.isConnected = false;
            this.responseQueue = [];
            this.audioParts = [];
            this.currentText = '';
            this.currentAudioParts = [];
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

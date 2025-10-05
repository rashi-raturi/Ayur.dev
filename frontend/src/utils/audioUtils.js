/**
 * Audio utilities for recording, WAV conversion, and playback
 */

/**
 * Parse MIME type to extract audio configuration
 * @param {string} mimeType - Audio MIME type (e.g., "audio/L16;rate=24000")
 * @returns {Object} Audio configuration
 */
export function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options = {
    numChannels: 1,
    bitsPerSample: 16,
    sampleRate: 24000, // Default
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
 * @param {Object} options - Audio configuration
 * @returns {Uint8Array} WAV header
 */
export function createWavHeader(dataLength, options) {
  const { numChannels, sampleRate, bitsPerSample } = options;

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

/**
 * Write string to DataView
 * @param {DataView} view - DataView to write to
 * @param {number} offset - Offset to start writing
 * @param {string} string - String to write
 */
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convert base64 audio parts to WAV format
 * @param {string[]} rawData - Array of base64 encoded audio data
 * @param {string} mimeType - MIME type of audio
 * @returns {Blob} WAV audio blob
 */
export function convertToWav(rawData, mimeType) {
  const options = parseMimeType(mimeType);
  
  // Convert base64 strings to binary data
  const binaryParts = rawData.map(data => {
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  });

  // Calculate total data length
  const dataLength = binaryParts.reduce((sum, part) => sum + part.length, 0);

  // Create WAV header
  const wavHeader = createWavHeader(dataLength, options);

  // Combine header and data
  const wavData = new Uint8Array(wavHeader.length + dataLength);
  wavData.set(wavHeader, 0);
  
  let offset = wavHeader.length;
  for (const part of binaryParts) {
    wavData.set(part, offset);
    offset += part.length;
  }

  return new Blob([wavData], { type: 'audio/wav' });
}

/**
 * Play audio blob
 * @param {Blob} audioBlob - Audio blob to play
 * @returns {Promise<void>}
 */
export function playAudio(audioBlob) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.onended = () => {
      URL.revokeObjectURL(audio.src);
      resolve();
    };
    audio.onerror = (error) => {
      URL.revokeObjectURL(audio.src);
      reject(error);
    };
    audio.play().catch(reject);
  });
}

/**
 * Record audio from microphone
 * @param {number} duration - Duration in milliseconds (optional)
 * @returns {Promise<Blob>} Recorded audio blob
 */
export async function recordAudio(duration) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(track => track.stop());
      resolve(audioBlob);
    };

    mediaRecorder.onerror = (error) => {
      stream.getTracks().forEach(track => track.stop());
      reject(error);
    };

    mediaRecorder.start();

    if (duration) {
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, duration);
    }

    // Return a function to stop recording manually
    mediaRecorder.stopRecording = () => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  });
}

/**
 * Convert audio blob to base64
 * @param {Blob} blob - Audio blob
 * @returns {Promise<string>} Base64 encoded string
 */
export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get audio context for Web Audio API
 * @returns {AudioContext}
 */
export function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return new AudioContext();
}

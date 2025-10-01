export class AudioManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.sounds = {};
        this.volume = 0.7;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio context not supported');
        }
    }

    // Create gentle, autism-friendly sound effects using Web Audio API
    createTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        // Soft attack and decay for gentle sounds
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Gentle success sound
    playSuccess() {
        if (!this.enabled) return;
        
        // Pleasant ascending chord
        setTimeout(() => this.createTone(523.25, 0.3), 0);   // C5
        setTimeout(() => this.createTone(659.25, 0.3), 100); // E5
        setTimeout(() => this.createTone(783.99, 0.4), 200); // G5
    }

    // Soft error sound
    playError() {
        if (!this.enabled) return;
        
        // Gentle descending tone
        this.createTone(220, 0.2);
        setTimeout(() => this.createTone(196, 0.3), 100);
    }

    // Button press sound
    playClick() {
        if (!this.enabled) return;
        
        this.createTone(800, 0.1, 'square');
    }

    // Level complete celebration
    playLevelComplete() {
        if (!this.enabled) return;
        
        // Happy melody
        const melody = [523.25, 587.33, 659.25, 698.46, 783.99]; // C-D-E-F-G
        melody.forEach((freq, i) => {
            setTimeout(() => this.createTone(freq, 0.2), i * 150);
        });
    }

    // Gentle tap sound for game items
    playTap() {
        if (!this.enabled) return;
        
        this.createTone(440, 0.1, 'triangle');
    }

    // Achievement unlock sound
    playAchievement() {
        if (!this.enabled) return;
        
        // Triumphant but gentle fanfare
        setTimeout(() => this.createTone(523.25, 0.3), 0);
        setTimeout(() => this.createTone(659.25, 0.3), 200);
        setTimeout(() => this.createTone(783.99, 0.3), 400);
        setTimeout(() => this.createTone(1046.50, 0.5), 600);
    }

    // Background ambient sound (very subtle)
    playAmbient() {
        if (!this.enabled) return;
        
        // Subtle nature-like sound
        const noise = this.audioContext.createBufferSource();
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.05; // Very quiet white noise
        }
        
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        noise.start();
        
        // Stop after 30 seconds
        setTimeout(() => {
            if (noise.stop) noise.stop();
        }, 30000);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled && this.audioContext) {
            this.audioContext.suspend();
        } else if (enabled && this.audioContext) {
            this.audioContext.resume();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // Text-to-speech for accessibility
    speak(text, lang = 'en') {
        if (!this.enabled || !('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.volume = this.volume;
        utterance.rate = 0.8; // Slower rate for better comprehension
        utterance.pitch = 1.1; // Slightly higher pitch for friendliness
        
        speechSynthesis.speak(utterance);
    }

    // Stop all speech
    stopSpeech() {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
    }
}
/**
 * Sound Effects Utility for Bobo Animations
 * Provides audio feedback for different animation contexts
 */

class SoundEffectsManager {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.enabled = false;
    this.volume = 0.3;
    this.initialized = false;
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Generate sound effects
      await this.generateSounds();
      
      this.initialized = true;
      this.enabled = true;
      
      console.log('🔊 Bobo sound effects initialized');
    } catch (error) {
      console.warn('Sound effects not available:', error);
      this.enabled = false;
    }
  }

  /**
   * Generate procedural sound effects
   */
  async generateSounds() {
    if (!this.audioContext) return;

    // Slide-in sound (ascending chirp)
    this.sounds.set('slide', this.createChirpSound(200, 400, 0.3));
    
    // Thinking sound (gentle pulse)
    this.sounds.set('thinking', this.createPulseSound(150, 0.2, 2));
    
    // Celebration sound (happy chime)
    this.sounds.set('celebration', this.createChimeSound([262, 330, 392, 523], 0.4));
    
    // Helper sound (friendly beep)
    this.sounds.set('helper', this.createBeepSound(300, 0.2));
    
    // Problem solving sound (focused tone)
    this.sounds.set('problem-solving', this.createFocusSound(180, 0.25));
  }

  /**
   * Create a chirp sound (frequency sweep)
   */
  createChirpSound(startFreq, endFreq, duration) {
    return () => {
      if (!this.audioContext || !this.enabled) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }

  /**
   * Create a pulse sound (rhythmic beeping)
   */
  createPulseSound(frequency, duration, pulses) {
    return () => {
      if (!this.audioContext || !this.enabled) return;

      const pulseDuration = duration / pulses;
      const pauseDuration = pulseDuration * 0.3;
      
      for (let i = 0; i < pulses; i++) {
        const startTime = this.audioContext.currentTime + (i * (pulseDuration + pauseDuration));
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + pulseDuration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + pulseDuration);
      }
    };
  }

  /**
   * Create a chime sound (multiple frequencies)
   */
  createChimeSound(frequencies, duration) {
    return () => {
      if (!this.audioContext || !this.enabled) return;

      frequencies.forEach((freq, index) => {
        const delay = index * 0.1;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.6, this.audioContext.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + delay + duration);
        
        oscillator.start(this.audioContext.currentTime + delay);
        oscillator.stop(this.audioContext.currentTime + delay + duration);
      });
    };
  }

  /**
   * Create a simple beep sound
   */
  createBeepSound(frequency, duration) {
    return () => {
      if (!this.audioContext || !this.enabled) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }

  /**
   * Create a focus sound (modulated tone)
   */
  createFocusSound(frequency, duration) {
    return () => {
      if (!this.audioContext || !this.enabled) return;

      const oscillator = this.audioContext.createOscillator();
      const lfo = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const lfoGain = this.audioContext.createGain();
      
      // Setup LFO for modulation
      lfo.frequency.setValueAtTime(5, this.audioContext.currentTime);
      lfo.connect(lfoGain);
      lfoGain.gain.setValueAtTime(10, this.audioContext.currentTime);
      lfoGain.connect(oscillator.frequency);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
      
      lfo.start(this.audioContext.currentTime);
      oscillator.start(this.audioContext.currentTime);
      
      lfo.stop(this.audioContext.currentTime + duration);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }

  /**
   * Play a sound effect by name
   */
  play(soundName) {
    if (!this.enabled || !this.sounds.has(soundName)) {
      return;
    }

    try {
      const soundFunction = this.sounds.get(soundName);
      soundFunction();
    } catch (error) {
      console.warn(`Failed to play sound ${soundName}:`, error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable/disable sound effects
   */
  setEnabled(enabled) {
    this.enabled = enabled && this.initialized;
  }

  /**
   * Check if sound effects are available
   */
  isAvailable() {
    return this.initialized && this.enabled;
  }

  /**
   * Get available sound names
   */
  getAvailableSounds() {
    return Array.from(this.sounds.keys());
  }
}

// Create singleton instance
const soundEffects = new SoundEffectsManager();

// Auto-initialize on first user interaction
let autoInitialized = false;
const autoInitialize = () => {
  if (!autoInitialized) {
    soundEffects.initialize();
    autoInitialized = true;
    
    // Remove listeners after initialization
    document.removeEventListener('click', autoInitialize);
    document.removeEventListener('touchstart', autoInitialize);
    document.removeEventListener('keydown', autoInitialize);
  }
};

// Add event listeners for auto-initialization
document.addEventListener('click', autoInitialize, { once: true });
document.addEventListener('touchstart', autoInitialize, { once: true });
document.addEventListener('keydown', autoInitialize, { once: true });

export default soundEffects;

/**
 * React hook for using sound effects
 */
export const useSoundEffects = () => {
  const [isAvailable, setIsAvailable] = React.useState(soundEffects.isAvailable());
  
  React.useEffect(() => {
    const checkAvailability = () => setIsAvailable(soundEffects.isAvailable());
    
    // Check periodically for initialization
    const interval = setInterval(checkAvailability, 1000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, []);
  
  return {
    play: soundEffects.play.bind(soundEffects),
    setVolume: soundEffects.setVolume.bind(soundEffects),
    setEnabled: soundEffects.setEnabled.bind(soundEffects),
    isAvailable,
    availableSounds: soundEffects.getAvailableSounds()
  };
};
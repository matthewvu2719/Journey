import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    type: 'sine',
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    }
  })),
  destination: {},
  currentTime: 0
};

// Mock AudioContext constructor
global.AudioContext = vi.fn(() => mockAudioContext);
global.webkitAudioContext = vi.fn(() => mockAudioContext);

describe('SoundEffectsManager', () => {
  let SoundEffectsManager;
  let soundEffects;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset module to get fresh instance
    vi.resetModules();
    
    // Import after mocking
    const module = await import('./soundEffects.js');
    SoundEffectsManager = module.default.constructor;
    soundEffects = module.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes audio context successfully', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      expect(manager.initialized).toBe(true);
      expect(manager.enabled).toBe(true);
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('handles initialization failure gracefully', async () => {
      global.AudioContext = vi.fn(() => {
        throw new Error('Audio not supported');
      });
      
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      expect(manager.initialized).toBe(false);
      expect(manager.enabled).toBe(false);
    });

    it('does not reinitialize if already initialized', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      const firstCallCount = global.AudioContext.mock.calls.length;
      
      await manager.initialize();
      const secondCallCount = global.AudioContext.mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('Sound Generation', () => {
    it('generates all required sounds', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      expect(manager.sounds.has('slide')).toBe(true);
      expect(manager.sounds.has('thinking')).toBe(true);
      expect(manager.sounds.has('celebration')).toBe(true);
      expect(manager.sounds.has('helper')).toBe(true);
      expect(manager.sounds.has('problem-solving')).toBe(true);
    });

    it('creates chirp sound correctly', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      const chirpSound = manager.createChirpSound(200, 400, 0.3);
      
      expect(typeof chirpSound).toBe('function');
      
      // Test sound execution
      chirpSound();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('creates pulse sound correctly', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      const pulseSound = manager.createPulseSound(150, 0.2, 2);
      
      expect(typeof pulseSound).toBe('function');
      
      // Test sound execution
      pulseSound();
      
      // Should create oscillators for each pulse
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('creates chime sound correctly', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      const chimeSound = manager.createChimeSound([262, 330, 392], 0.4);
      
      expect(typeof chimeSound).toBe('function');
      
      // Test sound execution
      chimeSound();
      
      // Should create oscillators for each frequency
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });
  });

  describe('Sound Playback', () => {
    it('plays sound when enabled and initialized', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      const mockSoundFunction = vi.fn();
      manager.sounds.set('test', mockSoundFunction);
      
      manager.play('test');
      
      expect(mockSoundFunction).toHaveBeenCalled();
    });

    it('does not play sound when disabled', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      manager.setEnabled(false);
      
      const mockSoundFunction = vi.fn();
      manager.sounds.set('test', mockSoundFunction);
      
      manager.play('test');
      
      expect(mockSoundFunction).not.toHaveBeenCalled();
    });

    it('does not play sound when not initialized', () => {
      const manager = new SoundEffectsManager();
      
      const mockSoundFunction = vi.fn();
      manager.sounds.set('test', mockSoundFunction);
      
      manager.play('test');
      
      expect(mockSoundFunction).not.toHaveBeenCalled();
    });

    it('handles nonexistent sound gracefully', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      expect(() => manager.play('nonexistent')).not.toThrow();
    });

    it('handles sound execution errors gracefully', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      const errorSound = vi.fn(() => {
        throw new Error('Sound error');
      });
      manager.sounds.set('error', errorSound);
      
      expect(() => manager.play('error')).not.toThrow();
    });
  });

  describe('Volume Control', () => {
    it('sets volume within valid range', () => {
      const manager = new SoundEffectsManager();
      
      manager.setVolume(0.5);
      expect(manager.volume).toBe(0.5);
      
      manager.setVolume(1.5); // Above max
      expect(manager.volume).toBe(1);
      
      manager.setVolume(-0.5); // Below min
      expect(manager.volume).toBe(0);
    });

    it('uses volume in sound generation', async () => {
      const manager = new SoundEffectsManager();
      manager.setVolume(0.8);
      
      await manager.initialize();
      
      const chirpSound = manager.createChirpSound(200, 400, 0.3);
      chirpSound();
      
      // Volume should be used in gain node
      const gainNode = mockAudioContext.createGain();
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.8, expect.any(Number));
    });
  });

  describe('Enable/Disable', () => {
    it('enables sound effects when initialized', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      manager.setEnabled(true);
      expect(manager.enabled).toBe(true);
    });

    it('does not enable sound effects when not initialized', () => {
      const manager = new SoundEffectsManager();
      
      manager.setEnabled(true);
      expect(manager.enabled).toBe(false);
    });

    it('disables sound effects', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      manager.setEnabled(false);
      expect(manager.enabled).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('reports availability correctly', async () => {
      const manager = new SoundEffectsManager();
      
      expect(manager.isAvailable()).toBe(false);
      
      await manager.initialize();
      
      expect(manager.isAvailable()).toBe(true);
    });

    it('returns available sound names', async () => {
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      const sounds = manager.getAvailableSounds();
      
      expect(sounds).toContain('slide');
      expect(sounds).toContain('thinking');
      expect(sounds).toContain('celebration');
      expect(sounds).toContain('helper');
      expect(sounds).toContain('problem-solving');
    });
  });

  describe('Auto-initialization', () => {
    it('sets up event listeners for auto-initialization', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      
      // Re-import to trigger event listener setup
      vi.resetModules();
      import('./soundEffects.js');
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), { once: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { once: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), { once: true });
      
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('handles Web Audio API not available', async () => {
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;
      
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      expect(manager.initialized).toBe(false);
      expect(manager.enabled).toBe(false);
    });

    it('handles oscillator creation failure', async () => {
      mockAudioContext.createOscillator = vi.fn(() => {
        throw new Error('Oscillator creation failed');
      });
      
      const manager = new SoundEffectsManager();
      
      await manager.initialize();
      
      // Should still initialize but sound playback will fail gracefully
      expect(manager.initialized).toBe(true);
      
      expect(() => manager.play('slide')).not.toThrow();
    });
  });
});
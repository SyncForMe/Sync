// Sound System for SYNC Cross-Chain App
class SoundSystem {
  constructor() {
    this.enabled = true;
    this.sounds = {};
    this.initializeSounds();
  }

  initializeSounds() {
    // Create audio contexts for different sound effects
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Define sound frequencies for cyberpunk effects
    this.soundTypes = {
      connect: { frequency: 800, duration: 0.3, type: 'sine' },
      swap: { frequency: 600, duration: 0.5, type: 'sawtooth' },
      success: { frequency: 900, duration: 0.4, type: 'triangle' },
      error: { frequency: 200, duration: 0.6, type: 'square' },
      click: { frequency: 400, duration: 0.1, type: 'sine' },
      notification: { frequency: 700, duration: 0.2, type: 'triangle' }
    };
  }

  playSound(type) {
    if (!this.enabled || !this.soundTypes[type]) return;

    try {
      const { frequency, duration, type: waveType } = this.soundTypes[type];
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = waveType;
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.log('Sound system error:', error);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Export for use in components
window.SoundSystem = SoundSystem;

export default SoundSystem;
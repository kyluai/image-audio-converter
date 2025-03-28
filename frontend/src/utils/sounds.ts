// URLs to actual sound effects
const chimeSound = '/sounds/chime.mp3';
const successSound = '/sounds/success.mp3';

class SoundEffects {
  private static audioContext: AudioContext | null = null;
  private static initialized = false;

  private static async initialize() {
    if (!this.initialized) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.initialized = true;
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    }
    return this.audioContext;
  }

  private static async createChime() {
    const ctx = await this.initialize();
    if (!ctx) return;

    // Create oscillator for the bell sound
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Set up the bell-like sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    
    // Create bell-like envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    
    // Connect nodes
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Play sound
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1);
  }

  private static async createSuccess() {
    const ctx = await this.initialize();
    if (!ctx) return;

    // Create two oscillators for a pleasant chord
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Set up the harmonious sound
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    
    // Create harp-like envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    
    // Connect nodes
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Play sound
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 1.5);
    osc2.stop(ctx.currentTime + 1.5);
  }

  static async playChime() {
    try {
      await this.createChime();
    } catch (error) {
      console.error('Error playing chime:', error);
    }
  }

  static async playSuccess() {
    try {
      await this.createSuccess();
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }
}

export default SoundEffects; 
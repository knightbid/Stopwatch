class AudioService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  private init() {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          console.warn("Web Audio API is not supported in this browser environment.");
          return;
        }
        this.audioContext = new AudioCtx();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = 0.5; // Default volume
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn("Failed to resume suspended AudioContext:", err);
        });
      }
    } catch (e) {
      console.error("Failed to initialize or resume AudioContext:", e);
    }
  }

  public playBeep(frequency: number = 800, type: OscillatorType = 'sine', duration: number = 0.1) {
    try {
      this.init();
      if (!this.audioContext || !this.gainNode) return;

      if (frequency <= 0) return; // Silent warmup or zero-frequency guard

      const oscillator = this.audioContext.createOscillator();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      // Create an individual gain node specifically for this oscillator
      // to shape its envelope without affecting other concurrent audio sources
      const individualGain = this.audioContext.createGain();
      oscillator.connect(individualGain);
      individualGain.connect(this.gainNode);

      const now = this.audioContext.currentTime;
      individualGain.gain.setValueAtTime(0, now);
      individualGain.gain.linearRampToValueAtTime(0.4, now + 0.005); // Rapid slick attack
      individualGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Smooth decay

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (err) {
      console.warn("Could not play timer beep sound:", err);
    }
  }

  public playExplosion() {
    try {
      this.init();
      if (!this.audioContext || !this.gainNode) return;

      // Simulate an explosion with a low frequency decay and noise if possible,
      // but for simplicity, a descending saw wave.
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = 'sawtooth';
      
      const now = this.audioContext.currentTime;
      oscillator.frequency.setValueAtTime(100, now);
      oscillator.frequency.exponentialRampToValueAtTime(10, now + 1);

      const gain = this.audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1);

      oscillator.start(now);
      oscillator.stop(now + 1);
    } catch (err) {
      console.warn("Could not play complete timer buzzer/explosion sound:", err);
    }
  }
}

export const audioService = new AudioService();
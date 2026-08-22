/**
 * Meditative Ethereal Zen Chimes & Harmonic Singing Bowls Engine
 * Replaces harsh continuous drones with soothing, polyphonic decaying crystal chimes
 * and celestial glass marimba notes tuned to the C Major 9 / A Minor pentatonic scale.
 */

export class ChaoticSonifier {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;

    // Harmonic Zen Pentatonic Tuning (C Major / A Minor celestial tones)
    this.notes = [
      { name: 'C4', freq: 261.63 },
      { name: 'D4', freq: 293.66 },
      { name: 'E4', freq: 329.63 },
      { name: 'G4', freq: 392.00 },
      { name: 'A4', freq: 440.00 },
      { name: 'B4', freq: 493.88 },
      { name: 'C5', freq: 523.25 },
      { name: 'D5', freq: 587.33 },
      { name: 'E5', freq: 659.25 },
      { name: 'G5', freq: 783.99 },
      { name: 'A5', freq: 880.00 },
      { name: 'C6', freq: 1046.50 }
    ];

    this.masterGain = null;
    this.reverbFilter = null;
    this.lastTriggerTime = 0;
    this.minInterval = 0.25; // Gentle spacing between chime plucks
    this.prevX = 0;
    this.prevY = 0;
    this.prevZ = 0;

    // Polyphonic Voice Pool (Decaying Tibetan singing bowl / crystal chimes)
    this.voicePoolSize = 8;
    this.voices = [];
    this.currentVoice = 0;
  }

  /**
   * Initializes high-fidelity Web Audio nodes.
   */
  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master Volume Controller with smooth warm limiter
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    // Warm Analog Lowpass Resonance Filter (Cuts harsh digital bite)
    this.reverbFilter = this.ctx.createBiquadFilter();
    this.reverbFilter.type = 'lowpass';
    this.reverbFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.reverbFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    this.reverbFilter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Initialize Voice Pool
    for (let i = 0; i < this.voicePoolSize; i++) {
      const voiceGain = this.ctx.createGain();
      voiceGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Stereo panner for spatial immersion
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) {
        voiceGain.connect(panner);
        panner.connect(this.reverbFilter);
      } else {
        voiceGain.connect(this.reverbFilter);
      }

      this.voices.push({
        gain: voiceGain,
        panner: panner,
        activeOsc: null,
        activeHarmonicOsc: null
      });
    }
  }

  /**
   * Toggles ambient audio.
   */
  toggle() {
    if (!this.ctx) {
      this.init();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = !this.isPlaying;
    const now = this.ctx.currentTime;

    if (this.isPlaying) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.35, now + 1.0);
      // Play a welcoming opening chime
      this.playChime(523.25, 0.0, 0.5);
    } else {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    }

    return this.isPlaying;
  }

  /**
   * Plays a delicate, decaying crystal bell chime.
   */
  playChime(freq, pan = 0, volume = 0.4) {
    if (!this.ctx || !this.isPlaying) return;

    const now = this.ctx.currentTime;
    const voice = this.voices[this.currentVoice];
    this.currentVoice = (this.currentVoice + 1) % this.voicePoolSize;

    // Clean up previous voice oscillators if active
    if (voice.activeOsc) {
      try { voice.activeOsc.stop(); voice.activeOsc.disconnect(); } catch (_) {}
    }
    if (voice.activeHarmonicOsc) {
      try { voice.activeHarmonicOsc.stop(); voice.activeHarmonicOsc.disconnect(); } catch (_) {}
    }

    // 1. Fundamental Pure Sine Chime (Singing bowl resonance)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // 2. Soft Crystal Harmonic Overtone (2.76x crystalline glass ratio)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.0, now);

    const harmGain = this.ctx.createGain();
    harmGain.gain.setValueAtTime(0.18, now);

    osc1.connect(voice.gain);
    osc2.connect(harmGain);
    harmGain.connect(voice.gain);

    // Spatial Panning
    if (voice.panner) {
      voice.panner.pan.setValueAtTime(Math.max(-0.75, Math.min(0.75, pan)), now);
    }

    // Natural decaying bell envelope: fast gentle attack (15ms), long soothing decay (2.2s)
    const decayDuration = 2.4;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(0.0001, now);
    voice.gain.gain.exponentialRampToValueAtTime(Math.min(0.28, volume * 0.22), now + 0.02);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + decayDuration + 0.1);
    osc2.stop(now + decayDuration + 0.1);

    voice.activeOsc = osc1;
    voice.activeHarmonicOsc = osc2;
  }

  /**
   * Modulates melodic plucks naturally timed with chaotic orbital momentum.
   */
  update(state = [0, 0, 0], speed = 1.0) {
    if (!this.isPlaying || !this.ctx) return;

    const [x, y, z] = state;
    const now = this.ctx.currentTime;

    // Calculate instantaneous motion delta
    const dx = x - this.prevX;
    const dy = y - this.prevY;
    const dz = z - this.prevZ;
    const motionMag = Math.hypot(dx, dy, dz);

    this.prevX = x;
    this.prevY = y;
    this.prevZ = z;

    // Trigger gentle crystal chimes at rhythmic orbital turns
    if (now - this.lastTriggerTime >= this.minInterval) {
      if (motionMag > 0.08 || Math.random() < 0.06) {
        // Map 3D coordinate position to harmonic scale notes
        const noteIndex = Math.floor(Math.abs(x * 3.7 + y * 2.3 + z * 1.5)) % this.notes.length;
        const selectedNote = this.notes[noteIndex];

        // Spatial pan maps to horizontal X position
        const pan = (x % 20) / 20.0;
        const noteVolume = Math.min(0.5, 0.2 + (motionMag / 5.0) * 0.3);

        this.playChime(selectedNote.freq, pan, noteVolume);
        this.lastTriggerTime = now;
      }
    }
  }
}

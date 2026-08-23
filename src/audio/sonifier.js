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
   * Modulates melodic plucks naturally timed with chaotic 3D orbital dynamics.
   * Driven by phase-space elevation, velocity magnitude, and orbital curvature turning points.
   */
  update(state = [0, 0, 0], speed = 1.0, center = [0, 0, 0]) {
    if (!this.isPlaying || !this.ctx) return;

    const [x, y, z] = state;
    const now = this.ctx.currentTime;

    const dx = x - this.prevX;
    const dy = y - this.prevY;
    const dz = z - this.prevZ;
    const motionMag = Math.hypot(dx, dy, dz);

    // Directional turning curvature detection
    const prevMag = Math.hypot(this.prevDx || 0, this.prevDy || 0, this.prevDz || 0);
    const dot = (dx * (this.prevDx || 0) + dy * (this.prevDy || 0) + dz * (this.prevDz || 0));
    const cosAngle = (motionMag > 1e-4 && prevMag > 1e-4) ? (dot / (motionMag * prevMag)) : 1.0;
    const isTurning = cosAngle < 0.97;

    this.prevX = x;
    this.prevY = y;
    this.prevZ = z;
    this.prevDx = dx;
    this.prevDy = dy;
    this.prevDz = dz;

    // Trigger deterministically at orbital turning cusps and inflection points (zero randomness)
    if (now - this.lastTriggerTime >= this.minInterval) {
      if (isTurning || motionMag > 0.4) {
        // Physical elevation in phase space determines the note on the harmonic pentatonic scale:
        // Lower elevation (vortex base) -> deep Tibetan singing bowl notes
        // Higher elevation (wing apex) -> ethereal celestial crystal chimes
        const relZ = z - (center[2] || 0);
        const normZ = Math.max(0, Math.min(1, (relZ + 25) / 50));
        const noteIndex = Math.min(this.notes.length - 1, Math.floor(normZ * this.notes.length));
        const selectedNote = this.notes[noteIndex];

        // Spatial pan maps strictly to horizontal phase-space X position
        const relX = x - (center[0] || 0);
        const pan = Math.max(-0.85, Math.min(0.85, relX / 25.0));
        const noteVolume = Math.min(0.55, 0.20 + Math.min(1.0, (motionMag * speed) / 2.0) * 0.35);

        this.playChime(selectedNote.freq, pan, noteVolume);
        this.lastTriggerTime = now;
      }
    }
  }

  /**
   * Sonifies 2D discrete maps and custom sandbox equation orbits.
   * Driven by continuous polar phase angle θ (tracing fractal winding arms) and step jump distance.
   */
  update2DMap(x = 0, y = 0, z = 0, scale = 0.25) {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;

    const r = Math.hypot(x, y);
    const theta = Math.atan2(y, x); // Polar phase angle in [-pi, pi]
    const normAngle = (theta + Math.PI) / (2 * Math.PI); // Normalized [0, 1)

    const stepDist = Math.hypot(x - this.prevX, y - this.prevY);
    const radDiff = Math.abs(r - (this.prevRadius || 0));

    this.prevX = x;
    this.prevY = y;
    this.prevZ = z;
    this.prevRadius = r;

    // Trigger deterministically when the orbit leaps across polar boundaries or radius extrema
    if (now - this.lastTriggerTime >= 0.24) {
      if (radDiff > 0.12 || stepDist > 0.3) {
        // Polar phase angle directly selects scale note (melody traces geometric manifold winding number)
        const noteIndex = Math.min(this.notes.length - 1, Math.floor(normAngle * this.notes.length));
        const selectedNote = this.notes[noteIndex];

        const pan = Math.max(-0.8, Math.min(0.8, x * scale * 3.5));
        const noteVolume = Math.min(0.48, 0.20 + Math.min(1.0, stepDist / 2.5) * 0.28);

        this.playChime(selectedNote.freq, pan, noteVolume);
        this.lastTriggerTime = now;
      }
    }
  }

  /**
   * Sonifies the double pendulum system from exact Lagrangian mechanics.
   * Driven by kinetic energy peaks (bottom swings) and potential elevation cusps (top flips).
   */
  updatePendulum(theta1 = 0, theta2 = 0, omega1 = 0, omega2 = 0, l1 = 1.0, l2 = 1.0, m1 = 1.0, m2 = 1.0) {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Lagrangian kinetic energy T
    const delta = theta1 - theta2;
    const kineticEnergy = 0.5 * (m1 + m2) * l1 * l1 * omega1 * omega1 +
                          0.5 * m2 * l2 * l2 * omega2 * omega2 +
                          m2 * l1 * l2 * omega1 * omega2 * Math.cos(delta);

    // Instantaneous outer bob positions
    const x2 = l1 * Math.sin(theta1) + l2 * Math.sin(theta2);
    const y2 = l1 * Math.cos(theta1) + l2 * Math.cos(theta2); // +Downwards, -Upwards

    // Total height above bottom: 0 = hanging bottom, 2*(l1+l2) = overhead vertical flip
    const maxLen = l1 + l2;
    const height = maxLen - y2;
    const normHeight = Math.max(0, Math.min(1, height / (2 * maxLen)));

    // Turning inflection detection
    const isApex = Math.abs(omega2) < 0.3 && Math.abs(this.prevOmega2 || 0) >= 0.3;
    const isKineticPeak = kineticEnergy > 5.0;

    this.prevOmega1 = omega1;
    this.prevOmega2 = omega2;

    // Trigger deterministically at energy extrema (bottom power swings or top loop flips)
    if (now - this.lastTriggerTime >= 0.20) {
      if (isApex || isKineticPeak || kineticEnergy > 1.0) {
        // Height in gravitational field maps to harmonic pitch:
        // Deep Tibetan singing bowl tones at bottom speed, celestial crystal bells at top flips
        const noteIndex = Math.min(this.notes.length - 1, Math.floor(normHeight * this.notes.length));
        const selectedNote = this.notes[noteIndex];

        const pan = Math.max(-0.85, Math.min(0.85, x2 / maxLen));
        const noteVolume = Math.min(0.55, 0.20 + Math.min(1.0, kineticEnergy / 25.0) * 0.35);

        this.playChime(selectedNote.freq, pan, noteVolume);
        this.lastTriggerTime = now;
      }
    }
  }

  /**
   * Sonifies Feigenbaum bifurcation cascade delay embedding points.
   * State coordinate x drives harmonic intervals in periodic windows and shimmering chords in chaos.
   */
  updateBifurcation(r = 3.5, x = 0.5) {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;

    const diff = Math.abs(x - (this.prevBifX || 0));
    this.prevBifX = x;

    if (now - this.lastTriggerTime >= 0.30) {
      if (diff > 0.04) {
        const normX = Math.max(0, Math.min(1, x));
        const noteIndex = Math.min(this.notes.length - 1, Math.floor(normX * this.notes.length));
        const selectedNote = this.notes[noteIndex];

        // Stereo pan corresponds to growth parameter r
        const pan = Math.max(-0.85, Math.min(0.85, (r - 3.2) / 0.8));
        const noteVolume = Math.min(0.40, 0.20 + Math.min(1.0, diff * 3.0) * 0.20);

        this.playChime(selectedNote.freq, pan, noteVolume);
        this.lastTriggerTime = now;
      }
    }
  }
}

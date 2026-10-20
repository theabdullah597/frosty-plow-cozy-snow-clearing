/**
 * Procedural Web Audio Synth for Frosty Plow
 * Cozy ambient synth chords, reactive truck engine hum, crisp snow-cutting churn,
 * pentatonic combo bells, turbo boost sweeps, and collision thuds.
 */

class SynthAudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Music state
  private musicGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private chordIndex: number = 0;

  // Engine state
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Snow churn noise state
  private snowNoiseNode: AudioNode | null = null;
  private snowFilter: BiquadFilterNode | null = null;
  private snowGain: GainNode | null = null;

  // Blizzard wind state
  private windNoiseNode: AudioNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngine();
      this.setupSnowChurn();
      this.setupBlizzardWind();
      this.startMusic();
    } catch {
      // Audio not supported or blocked
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Cozy Ambient Winter Pad Chords (Ebmaj9, Cm7, Fm9, Bb11)
  private startMusic() {
    if (!this.ctx || !this.masterGain || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    const chords = [
      [155.56, 196.00, 233.08, 293.66, 349.23], // Ebmaj9 (Eb3, G3, Bb3, D4, F4)
      [130.81, 196.00, 233.08, 311.13, 392.00], // Cm7 (C3, G3, Bb3, Eb4, G4)
      [174.61, 207.65, 261.63, 311.13, 392.00], // Fm9 (F3, Ab3, C4, Eb4, G4)
      [116.54, 174.61, 233.08, 261.63, 349.23], // Bb11 (Bb2, F3, Bb3, C4, F4)
    ];

    const playChord = () => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      const notes = chords[this.chordIndex % chords.length];
      this.chordIndex++;

      const now = this.ctx.currentTime;
      const duration = 6.5;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const voiceGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Warm sine + subtle triangle
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.8, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550 + idx * 80, now);
        filter.frequency.exponentialRampToValueAtTime(850 + idx * 60, now + duration * 0.5);
        filter.frequency.exponentialRampToValueAtTime(450, now + duration);

        voiceGain.gain.setValueAtTime(0, now);
        voiceGain.gain.linearRampToValueAtTime(0.045 / (idx + 1), now + 1.8);
        voiceGain.gain.linearRampToValueAtTime(0.035 / (idx + 1), now + duration * 0.7);
        voiceGain.gain.linearRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(voiceGain);
        voiceGain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });

      this.musicTimer = window.setTimeout(playChord, (duration - 1.2) * 1000);
    };

    playChord();
  }

  // Interactive Truck Engine Synth
  private setupEngine() {
    if (!this.ctx || !this.masterGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.07, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(38, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(19, this.ctx.currentTime); // sub rumble

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  // Update engine frequency & throttle based on truck speed & boost
  public updateEngine(speedNormalized: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc1 || !this.engineFilter || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = isBoosting ? 65 : 34;
    const targetFreq = baseFreq + speedNormalized * (isBoosting ? 90 : 65);
    const targetFilter = 140 + speedNormalized * 400 + (isBoosting ? 250 : 0);
    const targetVol = 0.05 + speedNormalized * 0.08 + (isBoosting ? 0.04 : 0);

    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.08);
    if (this.engineOsc2) {
      this.engineOsc2.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.08);
    }
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.08);
  }

  // Snow Plowing Churn Noise (Pink-ish filtered noise)
  private setupSnowChurn() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.2) * 0.25;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.snowFilter = this.ctx.createBiquadFilter();
    this.snowFilter.type = 'bandpass';
    this.snowFilter.frequency.setValueAtTime(1300, this.ctx.currentTime);
    this.snowFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.snowGain = this.ctx.createGain();
    this.snowGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    whiteNoise.connect(this.snowFilter);
    this.snowFilter.connect(this.snowGain);
    this.snowGain.connect(this.masterGain);

    whiteNoise.start();
    this.snowNoiseNode = whiteNoise;
  }

  public setSnowPlowing(isPlowing: boolean, intensity: number = 1.0) {
    if (!this.ctx || !this.snowGain || !this.snowFilter) return;
    const now = this.ctx.currentTime;
    const targetGain = isPlowing ? 0.09 * Math.min(intensity, 1.5) : 0.0001;
    this.snowGain.gain.setTargetAtTime(targetGain, now, 0.04);
    if (isPlowing) {
      const freq = 1200 + Math.random() * 400 + intensity * 300;
      this.snowFilter.frequency.setTargetAtTime(freq, now, 0.05);
    }
  }

  // Sparkling FM Combo Chimes (steps up in pentatonic scale)
  public playComboChime(combo: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
    const noteIndex = Math.min(Math.floor(combo) - 1, scale.length - 1);
    const baseFreq = scale[Math.max(0, noteIndex)];

    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const noteGain = this.ctx.createGain();

    // FM synthesis bell
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(baseFreq, now);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(baseFreq * 2.01, now);

    modGain.gain.setValueAtTime(baseFreq * 1.5, now);
    modGain.gain.exponentialRampToValueAtTime(0.1, now + 0.35);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    noteGain.gain.setValueAtTime(0.12, now);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    carrier.connect(noteGain);
    noteGain.connect(this.masterGain);

    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + 0.6);
    modulator.stop(now + 0.6);
  }

  // Turbo Boost resonant sweep
  public playTurboBoost() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.3);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.7);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  // Soft rubbery collision thud with hitstop
  public playCollisionThud() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Coin Payout sound
  public playCoin() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now);
    osc2.frequency.setValueAtTime(1975.53, now + 0.08); // B6

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  // District Cleared Fanfare
  public playVictoryFanfare() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const chords = [
      { f: 523.25, t: 0 },    // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.50, t: 0.36 }, // C6
      { f: 1318.51, t: 0.55 }, // E6 chord
      { f: 1567.98, t: 0.55 }  // G6 chord
    ];

    const now = this.ctx.currentTime;
    chords.forEach(({ f, t }) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0, now + t);
      gain.gain.linearRampToValueAtTime(0.12, now + t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + t);
      osc.stop(now + t + 1.3);
    });
  }

  // Blizzard Wind Generator (Filtered noise with resonant gusting)
  private setupBlizzardWind() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 3 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown/pink noise
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    windSource.start();
    this.windNoiseNode = windSource;
  }

  public updateWeatherWind(weather: 'clear' | 'light_snow' | 'blizzard', gustMod: number = 0) {
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const now = this.ctx.currentTime;

    if (weather === 'blizzard') {
      const targetGain = 0.16 + gustMod * 0.12;
      const targetFreq = 340 + gustMod * 420;
      this.windGain.gain.setTargetAtTime(targetGain, now, 0.1);
      this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.15);
    } else if (weather === 'light_snow') {
      const targetGain = 0.025 + gustMod * 0.02;
      const targetFreq = 220 + gustMod * 120;
      this.windGain.gain.setTargetAtTime(targetGain, now, 0.2);
      this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.2);
    } else {
      // Clear skies - wind is quiet
      this.windGain.gain.setTargetAtTime(0.0001, now, 0.4);
    }
  }

  // Sparkling Item Pickup sound (Hot cocoa, diamond, shaker, gift)
  public playItemPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66, 1760.0]; // D5, A5, D6, A6 sparkle
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.45);
    });
  }

  // Playful cheerful chime for Snowman greeting
  public playSnowmanCheer() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.55);
    });
  }

  public dispose() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const sound = new SynthAudioManager();

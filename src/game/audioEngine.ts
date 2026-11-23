import { ChapterId, WeatherCondition } from './types';

// Pure procedural Web Audio API engine: zero external .mp3/.wav files (Zero-404s).
// Reactive timbre shifts smoothly by biome + weather + jelly slow-motion!
class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private intervalId: number | null = null;
  private stepIdx = 0;

  private chapter: ChapterId = 1;
  private weather: WeatherCondition = 'calm';
  private isJelly = false;
  private isTun = false;
  private musicMode: 'menu' | 'adventure' = 'menu';
  private muted = false;
  private musicVol = 0.45;
  private sfxVol = 0.65;
  private nextNoteAt = 0;

  private ensureContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.masterGain);

    // Subtle ambient water/wind noise layer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 2.8;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 380;
    this.windFilter.Q.value = 1.4;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.03;

    noise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.musicGain);
    noise.start();

    this.startMusicLoop();
  }

  public unlock() {
    this.ensureContext();
  }

  public setMusicMode(mode: 'menu' | 'adventure') {
    this.musicMode = mode;
  }

  public setVolumes(musicVol: number, sfxVol: number, muted: boolean) {
    this.musicVol = musicVol;
    this.sfxVol = sfxVol;
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(musicVol, this.ctx.currentTime, 0.05);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(sfxVol, this.ctx.currentTime, 0.05);
    }
  }

  public setEnvironment(chapter: ChapterId, weather: WeatherCondition, isJelly: boolean, isTun: boolean) {
    this.chapter = chapter;
    this.weather = weather;
    this.isJelly = isJelly;
    this.isTun = isTun;

    if (this.windFilter && this.windGain && this.ctx) {
      const now = this.ctx.currentTime;
      const targetFreq =
        weather === 'rain' ? 880 : weather === 'wind' ? 540 : weather === 'heat' ? 240 : 380;
      const targetGain =
        isTun ? 0.008 : weather === 'rain' ? 0.075 : weather === 'wind' ? 0.06 : 0.025;
      this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.4);
      this.windGain.gain.setTargetAtTime(targetGain, now, 0.4);
    }
  }

  private startMusicLoop() {
    if (this.intervalId !== null) return;
    const scales: Record<ChapterId, number[]> = {
      1: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // Moss warm C pentatonic
      2: [293.66, 329.63, 392.0, 440.0, 493.88, 587.33], // Gutter D glassy
      3: [246.94, 293.66, 329.63, 369.99, 440.0, 493.88], // Puddle bright urban
      4: [196.0, 220.0, 246.94, 293.66, 329.63, 392.0], // Baron warm deep G
      5: [220.0, 261.63, 277.18, 329.63, 392.0, 440.0], // Fridge desert sparse
      6: [261.63, 329.63, 392.0, 493.88, 523.25, 659.25], // Greenhouse lush maj7
    };
    const menuNotes = [196.0, 246.94, 293.66, 329.63, 392.0, 440.0];
    const advPattern = [0, 2, 4, 3, 1, 5, 2, 4];
    const menuPattern = [0, 3, 2, 4, 1, 3];

    this.intervalId = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running' || this.muted) return;
      if (this.isTun) return; // Silence inside Tun barrel!

      const nowMs = performance.now();
      if (nowMs < this.nextNoteAt) return;

      const isMenu = this.musicMode === 'menu';
      this.nextNoteAt = nowMs + (isMenu ? 1420 : 760);

      const scale = isMenu ? menuNotes : scales[this.chapter] ?? scales[1];
      const pat = isMenu ? menuPattern : advPattern;
      const noteFreq = scale[pat[this.stepIdx % pat.length]] * (this.isJelly ? 0.5 : 1);
      this.stepIdx++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = isMenu
        ? 'sine'
        : this.weather === 'rain' || this.chapter === 2
          ? 'sine'
          : this.chapter === 5 || this.weather === 'heat'
            ? 'triangle'
            : 'sine';

      filter.type = 'lowpass';
      filter.frequency.value = isMenu ? 720 : this.isJelly ? 650 : this.weather === 'rain' ? 2400 : 1550;

      osc.frequency.setValueAtTime(noteFreq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(isMenu ? 0.055 : 0.082, now + (isMenu ? 0.32 : 0.07));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (isMenu ? 2.6 : this.isJelly ? 2.4 : 1.3));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 2.7);
    }, 180);
  }

  public playMenuHover() {
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.05);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playMenuClick(kind: 'droplet' | 'moss' = 'droplet') {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (kind === 'droplet') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.1);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playJump() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const jitter = 0.94 + Math.random() * 0.12;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(480 * jitter, now + 0.16);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playDroplet() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const jitter = 0.92 + Math.random() * 0.16;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(980 * jitter, now + 0.09);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playTunToggle(entering: boolean) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(entering ? 340 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(entering ? 150 : 380, now + 0.22);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playStep() {
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110 + Math.random() * 35, now);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playPuzzleChime() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.48);
    });
  }

  public playSensePulse(distNormalized: number) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    // Accessible audio cue: higher pitch = closer to water!
    const now = this.ctx.currentTime;
    const freq = 320 + (1 - Math.min(1, Math.max(0, distNormalized))) * 460;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public dispose() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioEngine = new ProceduralAudioEngine();

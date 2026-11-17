class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume = 0.14,
    delay = 0,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playCoin(combo = 0): void {
    const pitchScale = 1 + Math.min(10, combo) * 0.045;
    const jitter = 0.96 + Math.random() * 0.08;
    const f = 780 * pitchScale * jitter;
    this.playTone(f, f * 1.38, 0.11, 'triangle', 0.11);
    this.playTone(f * 1.5, f * 2.0, 0.12, 'sine', 0.08, 0.04);
  }

  playLaneSwitch(): void {
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone(260 * jitter, 420 * jitter, 0.075, 'sine', 0.07);
  }

  playJump(): void {
    this.playTone(220, 620, 0.16, 'sine', 0.13);
  }

  playLand(): void {
    this.playTone(130, 55, 0.09, 'triangle', 0.1);
  }

  playSlide(): void {
    this.playTone(480, 170, 0.14, 'sawtooth', 0.07);
  }

  playRaccoonKO(): void {
    this.playTone(280, 720, 0.14, 'square', 0.12);
    this.playTone(520, 980, 0.16, 'triangle', 0.11, 0.05);
  }

  playPowerActivate(): void {
    this.playTone(220, 880, 0.28, 'sawtooth', 0.14);
    this.playTone(440, 1320, 0.34, 'triangle', 0.14, 0.07);
  }

  playPowerup(): void {
    this.playTone(523.25, 659.25, 0.12, 'triangle', 0.12, 0);
    this.playTone(659.25, 783.99, 0.12, 'triangle', 0.12, 0.08);
    this.playTone(783.99, 1046.5, 0.18, 'triangle', 0.14, 0.16);
  }

  playHurt(): void {
    this.playTone(190, 52, 0.24, 'sawtooth', 0.18);
    this.playTone(130, 44, 0.28, 'square', 0.12, 0.04);
  }

  playGameOver(): void {
    this.playTone(392, 311, 0.2, 'sawtooth', 0.13, 0);
    this.playTone(311, 247, 0.22, 'sawtooth', 0.13, 0.18);
    this.playTone(247, 130, 0.38, 'sawtooth', 0.15, 0.36);
  }

  playClick(): void {
    this.playTone(540, 720, 0.06, 'triangle', 0.08);
  }
}

export const soundEngine = new SoundEngine();

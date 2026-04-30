export type AppSound =
  | 'nav'
  | 'select'
  | 'success'
  | 'warning'
  | 'error'
  | 'craft'
  | 'trade'
  | 'install'
  | 'win'
  | 'lose';

let context: AudioContext | null = null;
let unlockInstalled = false;
let unlocked = false;

const soundMap: Record<AppSound, { frequency: number; duration: number; type: OscillatorType; gain: number }> = {
  nav: { frequency: 420, duration: 0.045, type: 'sine', gain: 0.018 },
  select: { frequency: 520, duration: 0.055, type: 'triangle', gain: 0.025 },
  success: { frequency: 740, duration: 0.09, type: 'sine', gain: 0.035 },
  warning: { frequency: 190, duration: 0.12, type: 'square', gain: 0.03 },
  error: { frequency: 96, duration: 0.18, type: 'sawtooth', gain: 0.025 },
  craft: { frequency: 680, duration: 0.08, type: 'triangle', gain: 0.035 },
  trade: { frequency: 590, duration: 0.075, type: 'sine', gain: 0.032 },
  install: { frequency: 860, duration: 0.11, type: 'sine', gain: 0.04 },
  win: { frequency: 980, duration: 0.18, type: 'sine', gain: 0.045 },
  lose: { frequency: 84, duration: 0.32, type: 'sawtooth', gain: 0.03 },
};

export function installAudioUnlock() {
  if (unlockInstalled || typeof window === 'undefined') return;
  unlockInstalled = true;
  const unlock = () => {
    void ensureAudioUnlocked();
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
}

export async function ensureAudioUnlocked() {
  if (typeof window === 'undefined') return false;
  const AudioConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioConstructor) return false;
  context = context ?? new AudioConstructor();
  if (context.state === 'suspended') await context.resume().catch(() => undefined);
  unlocked = context.state === 'running';
  return unlocked;
}

export function playSound(sound: AppSound, enabled = true) {
  if (!enabled || typeof window === 'undefined') return;
  if (!context || !unlocked || context.state !== 'running') return;
  const settings = soundMap[sound];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = settings.type;
  oscillator.frequency.value = settings.frequency;
  gain.gain.setValueAtTime(settings.gain, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + settings.duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + settings.duration);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

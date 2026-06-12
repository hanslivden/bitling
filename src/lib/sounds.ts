let audioCtx: AudioContext | null = null;
let masterMuted = false;

export function setMuted(m: boolean) { masterMuted = m; }
export function getMuted() { return masterMuted; }

function ctx(): AudioContext | null {
  if (masterMuted) return null;
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  vol = 0.25,
  delay = 0,
) {
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + delay;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.01);
  gain.gain.linearRampToValueAtTime(0, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sounds = {
  beep()        { beep(880, 0.04); },

  feed()        {
    beep(523, 0.07);
    beep(659, 0.07, 'square', 0.25, 0.09);
    beep(784, 0.12, 'square', 0.25, 0.18);
  },

  play()        {
    [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.09, 'square', 0.2, i * 0.1));
  },

  clean()       {
    [880, 660, 440].forEach((f, i) => beep(f, 0.07, 'square', 0.22, i * 0.08));
  },

  medicine()    {
    beep(440, 0.1);
    beep(660, 0.1, 'square', 0.2, 0.14);
  },

  discipline()  { beep(220, 0.14, 'square', 0.38); },

  sick()        {
    beep(220, 0.28, 'sawtooth', 0.18);
    beep(196, 0.28, 'sawtooth', 0.18, 0.32);
  },

  hatch()       {
    [330, 392, 494, 659, 784].forEach((f, i) =>
      beep(f, 0.1, 'square', 0.28, i * 0.12));
  },

  evolve()      {
    [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) =>
      beep(f, 0.09, 'square', 0.28, i * 0.1));
  },

  happy()       {
    [784, 880, 1047].forEach((f, i) => beep(f, 0.08, 'square', 0.22, i * 0.1));
  },

  attention()   {
    [880, 880, 880].forEach((f, i) => beep(f, 0.09, 'square', 0.32, i * 0.22));
  },

  death()       {
    [392, 330, 262, 220, 196].forEach((f, i) =>
      beep(f, 0.22, 'square', 0.28, i * 0.26));
  },

  sleep()       {
    beep(330, 0.16, 'sine', 0.14);
    beep(262, 0.2, 'sine', 0.14, 0.3);
  },

  wake()        {
    beep(262, 0.1, 'square', 0.18);
    beep(392, 0.14, 'square', 0.18, 0.14);
  },

  refuse()      {
    beep(196, 0.12, 'sawtooth', 0.25);
    beep(165, 0.16, 'sawtooth', 0.25, 0.14);
  },

  gameWin()     {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      beep(f, 0.08, 'square', 0.25, i * 0.08));
  },

  gameLose()    {
    beep(330, 0.14, 'square', 0.22);
    beep(262, 0.2, 'square', 0.22, 0.16);
  },

  roundWin()    { beep(988, 0.07, 'square', 0.22); },
  roundLose()   { beep(220, 0.1, 'square', 0.22); },
};

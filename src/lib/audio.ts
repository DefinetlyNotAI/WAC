let context: AudioContext | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
export async function startAlarmSound(volume = 45) {
  if (typeof window === 'undefined') return;
  if (!context) context = new AudioContext();
  await context.resume();
  if (interval) return;
  function beep() {
    if (!context) return;
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type='square'; oscillator.frequency.value=880;
    gain.gain.value = Math.min(0.16, Math.max(0,volume)/1000);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + 0.19);
  }
  beep(); interval = setInterval(beep, 650);
}
export function stopAlarmSound() { if (interval) clearInterval(interval); interval=null; }

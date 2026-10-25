let context: AudioContext | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let output: GainNode | null = null;
let currentSound: 'standard' | 'chime' = 'standard';
let generation = 0;

export async function armAudio() {
    context ??= new AudioContext();
    await context.resume();
    return context.state === 'running';
}

export function setAlarmVolume(volume: number) {
    if (output) output.gain.value = Math.max(0, Math.min(100, volume)) / 700;
}

export async function startAlarmSound(volume = 45, sound: 'standard' | 'chime' = 'standard') {
    const requestedGeneration = generation;
    if (!await armAudio() || !context) throw new Error('Audio needs a user gesture');
    if (requestedGeneration !== generation) return;
    currentSound = sound;
    if (!output) {
        output = context.createGain();
        output.connect(context.destination);
    }
    setAlarmVolume(volume);
    if (interval) return;

    function beep() {
        if (!context || !output) return;
        const oscillator = context.createOscillator();
        oscillator.type = currentSound === 'chime' ? 'sine' : 'square';
        oscillator.frequency.value = currentSound === 'chime' ? 660 : 880;
        oscillator.connect(output);
        oscillator.onended = () => oscillator.disconnect();
        oscillator.start();
        oscillator.stop(context.currentTime + .19);
    }

    beep();
    interval = setInterval(beep, 650);
}

export function stopAlarmSound() {
    generation++;
    if (interval) clearInterval(interval);
    interval = null;
    if (output) output.gain.value = 0;
}

export async function disposeAudio() {
    stopAlarmSound();
    output?.disconnect();
    output = null;
    await context?.close();
    context = null;
}

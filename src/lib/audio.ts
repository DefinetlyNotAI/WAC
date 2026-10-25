
/* Types */

export type AlarmSound = 'standard' | 'chime';

type AlarmConfig = {
    frequency: number;
    wave: OscillatorType;
};

type AudioState = {
    context: AudioContext | null;
    interval: ReturnType<typeof setInterval> | null;
    output: GainNode | null;
    sound: AlarmSound;
    generation: number;
};

/* Constants */

const BEEP_DURATION = 0.19;
const BEEP_INTERVAL = 650;
const VOLUME_DIVISOR = 700;

const SOUND_CONFIG: Record<AlarmSound, AlarmConfig> = {
    standard: {
        frequency: 880,
        wave: 'square',
    },
    chime: {
        frequency: 660,
        wave: 'sine',
    },
};

/* State */

const state: AudioState = {
    context: null,
    interval: null,
    output: null,
    sound: 'standard',
    generation: 0,
};

/* Internal Helpers */

function getAudioContext(): AudioContext {
    return state.context ??= new AudioContext();
}

function getOutputNode(context: AudioContext): GainNode {
    if (state.output) return state.output;

    const output = context.createGain();
    output.connect(context.destination);

    state.output = output;
    return output;
}

function playBeep(): void {
    const { context, output, sound } = state;
    if (!context || !output) return;

    const config = SOUND_CONFIG[sound];
    const oscillator = context.createOscillator();

    oscillator.type = config.wave;
    oscillator.frequency.value = config.frequency;
    oscillator.connect(output);

    oscillator.onended = () => oscillator.disconnect();

    oscillator.start();
    oscillator.stop(context.currentTime + BEEP_DURATION);
}

/* Public Functions */

export async function armAudio(): Promise<boolean> {
    const context = getAudioContext();

    await context.resume();
    return context.state === 'running';
}

export function setAlarmVolume(volume: number): void {
    if (!state.output) return;

    const clamped = Math.max(0, Math.min(100, volume));
    state.output.gain.value = clamped / VOLUME_DIVISOR;
}

export async function startAlarmSound(
    volume = 45,
    sound: AlarmSound = 'standard',
): Promise<void> {
    const generation = state.generation;

    if (!await armAudio()) {
        throw new Error('Audio needs a user gesture');
    }

    if (generation !== state.generation) return;

    const context = getAudioContext();

    state.sound = sound;
    getOutputNode(context);
    setAlarmVolume(volume);

    if (state.interval !== null) return;

    playBeep();
    state.interval = setInterval(playBeep, BEEP_INTERVAL);
}

export function stopAlarmSound(): void {
    state.generation++;

    if (state.interval !== null) {
        clearInterval(state.interval);
        state.interval = null;
    }

    if (state.output) {
        state.output.gain.value = 0;
    }
}

export async function disposeAudio(): Promise<void> {
    stopAlarmSound();

    state.output?.disconnect();
    state.output = null;

    const context = state.context;
    state.context = null;

    if (context && context.state !== 'closed') {
        await context.close();
    }
}

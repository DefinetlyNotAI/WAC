'use client';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { disposeAudio, startAlarmSound, stopAlarmSound } from '@/lib/audio';
import type { AlarmSound } from '@/lib/storage';

export function useAlarmPlayback(ringing: boolean, audio: boolean, volume: number, sound: AlarmSound, setAudio: Dispatch<SetStateAction<boolean>>) {
    useEffect(() => {
        if (ringing && audio) {
            void startAlarmSound(volume, sound).catch(() => setAudio(false));
        } else stopAlarmSound();
    }, [ringing, audio, volume, sound, setAudio]);
    useEffect(() => () => { void disposeAudio(); }, []);
}

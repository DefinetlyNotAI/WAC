'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Local connectivity check. No requests leave the user's device. */
export function useNetworkStatus() {
    const [online, setOnline] = useState(true);
    const ongoing = useRef(false);
    const mounted = useRef(true);
    const retryNetwork = useCallback(async () => {
        if (ongoing.current) return;
        ongoing.current = true;

        try {
            const response = await fetch('/api/network', {
                cache: 'no-store',
            });

            if (!response.ok) {
                if (mounted.current) setOnline(navigator.onLine);
                return;
            }

            const result: { connected?: boolean | null } = await response.json();

            if (mounted.current) {
                setOnline(navigator.onLine && (result.connected ?? navigator.onLine));
            }
        } catch {
            if (mounted.current) setOnline(navigator.onLine);
        } finally {
            ongoing.current = false;
        }
    }, []);
    useEffect(() => {
        mounted.current = true;
        void retryNetwork();
        const timer = window.setInterval(() => void retryNetwork(), 15000);
        const onStatus = () => void retryNetwork();
        window.addEventListener('online', onStatus);
        window.addEventListener('offline', onStatus);
        return () => {
            mounted.current = false;
            window.clearInterval(timer);
            window.removeEventListener('online', onStatus);
            window.removeEventListener('offline', onStatus);
        };
    }, [retryNetwork]);
    return { online, retryNetwork };
}

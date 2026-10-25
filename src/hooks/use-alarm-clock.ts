'use client';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { SavedState } from '@/lib/storage';
import { accrueDebt, nextAlarm } from '@/lib/rules';

/** Timer and due-alarm transitions, independent of rendering and dialogs. */
export function useAlarmClock(ready: boolean, setState: Dispatch<SetStateAction<SavedState>>, setNow: Dispatch<SetStateAction<number>>) {
    useEffect(() => {
        if (!ready) return;
        const timer = window.setInterval(() => {
            const time = Date.now();
            setNow(time);
            setState(current => {
                let next = current;
                if (current.activeId && current.debtAt) {
                    next = { ...next, debt: accrueDebt(current.debt, (time - current.debtAt) / 60000), debtAt: time };
                }
                if (current.snoozeUntil && time >= current.snoozeUntil) {
                    next = { ...next, snoozeUntil: 0, expired: true };
                }
                if (!current.activeId) {
                    const due = current.alarms.find(alarm => alarm.enabled && alarm.nextAt <= time);
                    if (due) next = {
                        ...next, activeId: due.id, debtAt: time, expired: true,
                        alarms: next.alarms.map(alarm => alarm.id === due.id ? { ...alarm, nextAt: nextAlarm(alarm.time, time) } : alarm),
                        completed: { ...next.completed, 'dismiss-fake': false, ads: false, maintenance: false }
                    };
                }
                return next;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }, [ready, setNow, setState]);
}

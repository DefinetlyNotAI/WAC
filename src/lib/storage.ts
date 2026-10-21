export type Alarm = { id: string; time: string; enabled: boolean; nextAt: number };
export type Receipt = { id: string; title: string; lines: { label: string; cents: number }[]; total: number; at: number };
export type SavedState = {
  alarms: Alarm[]; activeId: string | null; snoozeUntil: number; score: number; xp: number;
  debt: number; debtAt: number; balance: number; snoozes: number; volume: number;
  premium: boolean; dlc: boolean; sound: 'standard' | 'chime'; receipts: Receipt[];
  encounters: Record<string, number>; completed: Record<string, boolean>;
  daily: string; rewardDay: string; cookies: boolean | null; accessibility: boolean;
  expired: boolean; verifiedDay: string; attempts: number; lockedUntil: number;
  region: string; updated: boolean; drmUntil: number; maintenanceUntil: number;
  paperwork: { reference: string; due: number } | null; device: string;
  pendingSnooze: 'snooze' | 'loot' | null;
};
export const initialState: SavedState = {
  alarms: [], activeId: null, snoozeUntil: 0, score: 650, xp: 0, debt: 0, debtAt: 0,
  balance: 2500, snoozes: 0, volume: 45, premium: false, dlc: false, sound: 'standard',
  receipts: [], encounters: {}, completed: {}, daily: '', rewardDay: '', cookies: null,
  accessibility: false, expired: false, verifiedDay: '', attempts: 0, lockedUntil: 0,
  region: '', updated: false, drmUntil: 0, maintenanceUntil: 0, paperwork: null, device: '',
  pendingSnooze: null,
};
export const STORAGE_KEY = 'wakeup-enterprise-local-v2';
export function readState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const base = { ...initialState, device: crypto.randomUUID(), region: navigator.language.split('-')[1] || 'US' };
      const old = JSON.parse(localStorage.getItem('wakeup-enterprise-local-v1') || 'null');
      if (!old) return base;
      const scheduled = new Date();
      const [hours, minutes] = String(old.alarmTime || '06:00').split(':').map(Number);
      scheduled.setHours(hours, minutes, 0, 0);
      if (scheduled.getTime() <= Date.now()) scheduled.setDate(scheduled.getDate() + 1);
      return { ...base, score: old.score ?? 650, xp: old.xp ?? 0, balance: Math.round((old.balance ?? 25) * 100), debt: (old.debt ?? 0) * 100, premium: !!old.premium, volume: old.volume ?? 45, snoozes: old.snoozes ?? 0, alarms: old.alarmEnabled ? [{ id: crypto.randomUUID(), time: old.alarmTime || '06:00', enabled: true, nextAt: scheduled.getTime() }] : [] };
    }
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved.alarms) || !Array.isArray(saved.receipts) || !Number.isFinite(saved.balance)) throw new Error('Invalid workspace');
    return { ...initialState, ...saved };
  } catch { return { ...initialState }; }
}
export function writeState(state: SavedState): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

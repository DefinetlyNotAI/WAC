export type SavedState = {
  alarmTime: string; alarmEnabled: boolean; alarmDate: string; score: number; xp: number;
  debt: number; balance: number; snoozes: number; volume: number; premium: boolean;
  dismissed: number; clickCount: number; history: string[]; enabled: Record<string,boolean>;
};
export const initialState: SavedState = {
  alarmTime: '06:00', alarmEnabled: false, alarmDate: '', score: 650, xp: 0, debt: 0,
  balance: 25, snoozes: 0, volume: 45, premium: false, dismissed: 0, clickCount: 0, history: [], enabled: {}
};
const KEY = 'wakeup-enterprise-local-v1';
export function readState(): SavedState { try { const raw = localStorage.getItem(KEY); return raw ? {...initialState,...JSON.parse(raw)} : initialState; } catch { return initialState; } }
export function writeState(state: SavedState) { try { localStorage.setItem(KEY,JSON.stringify(state)); } catch { /* optional persistence */ } }

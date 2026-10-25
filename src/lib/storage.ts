import { isValidAlarmTime, nextAlarm } from './rules';

/* Types */

export type AlarmSound = 'standard' | 'chime';

export type PendingSnooze = 'snooze' | 'loot' | null;

export type Alarm = {
    id: string;
    time: string;
    enabled: boolean;
    nextAt: number;
};

export type ReceiptLine = {
    label: string;
    cents: number;
};

export type Receipt = {
    id: string;
    title: string;
    lines: ReceiptLine[];
    total: number;
    at: number;
    paymentMethod?: string;
};

export type Paperwork = {
    reference: string;
    due: number;
};

export type SavedState = {
    alarms: Alarm[];
    activeId: string | null;
    snoozeUntil: number;
    score: number;
    xp: number;
    debt: number;
    debtAt: number;
    balance: number;
    snoozes: number;
    volume: number;
    premium: boolean;
    dlc: boolean;
    sound: AlarmSound;
    receipts: Receipt[];
    encounters: Record<string, number>;
    completed: Record<string, boolean>;
    daily: string;
    rewardDay: string;
    cookies: boolean | null;
    accessibility: boolean;
    expired: boolean;
    verifiedDay: string;
    attempts: number;
    lockedUntil: number;
    region: string;
    updated: boolean;
    drmUntil: number;
    maintenanceUntil: number;
    paperwork: Paperwork | null;
    device: string;
    pendingSnooze: PendingSnooze;
    pendingSurvey: boolean;
};

/* Constants */

export const STORAGE_KEY = 'wakeup-enterprise-local-v2';

const LEGACY_STORAGE_KEY = 'wakeup-enterprise-local-v1';
const SESSION_FEATURES_KEY = 'wac-session-features';

const DEFAULT_ALARM_TIME = '06:00';
const DEFAULT_REGION = 'US';
const CENTS_PER_DOLLAR = 100;

/* Initial State */

export const initialState: SavedState = {
    alarms: [],
    activeId: null,
    snoozeUntil: 0,
    score: 650,
    xp: 0,
    debt: 0,
    debtAt: 0,
    balance: 2500,
    snoozes: 0,
    volume: 45,
    premium: false,
    dlc: false,
    sound: 'standard',
    receipts: [],
    encounters: {},
    completed: {},
    daily: '',
    rewardDay: '',
    cookies: null,
    accessibility: false,
    expired: false,
    verifiedDay: '',
    attempts: 0,
    lockedUntil: 0,
    region: '',
    updated: false,
    drmUntil: 0,
    maintenanceUntil: 0,
    paperwork: null,
    device: '',
    pendingSnooze: null,
    pendingSurvey: false,
};

/* Internal Helpers */

function getRegion(): string {
    return navigator.language.split('-')[1] || DEFAULT_REGION;
}

function createInitialState(): SavedState {
    return {
        ...initialState,
        alarms: [],
        receipts: [],
        encounters: {},
        completed: {},
        device: crypto.randomUUID(),
        region: getRegion(),
    };
}

function parseStoredState(raw: string | null): unknown {
    if (!raw) return null;

    return JSON.parse(raw) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value);
}

function validNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function validBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function validString(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value : fallback;
}

function validateAlarm(value: unknown): value is Alarm {
    return isRecord(value) && typeof value.id === 'string' && typeof value.time === 'string' && isValidAlarmTime(value.time)
        && typeof value.enabled === 'boolean' && typeof value.nextAt === 'number'
        && Number.isFinite(value.nextAt);
}

function validateReceipt(value: unknown): value is Receipt {
    return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string'
        && typeof value.total === 'number' && Number.isFinite(value.total)
        && typeof value.at === 'number' && Number.isFinite(value.at)
        && Array.isArray(value.lines) && value.lines.every((line: unknown) => isRecord(line)
            && typeof line.label === 'string' && typeof line.cents === 'number' && Number.isFinite(line.cents))
        && (value.paymentMethod === undefined || typeof value.paymentMethod === 'string');
}

function validNumberMap(value: unknown): Record<string, number> {
    if (!isRecord(value)) return {};
    const result: Record<string, number> = {};
    for (const [key, entry] of Object.entries(value)) {
        if (typeof entry === 'number' && Number.isFinite(entry)) result[key] = entry;
    }
    return result;
}

function validBooleanMap(value: unknown): Record<string, boolean> {
    if (!isRecord(value)) return {};
    const result: Record<string, boolean> = {};
    for (const [key, entry] of Object.entries(value)) {
        if (typeof entry === 'boolean') result[key] = entry;
    }
    return result;
}

/** Sanitize each persisted field instead of trusting a partially checked JSON object. */
function sanitizeSavedState(value: unknown, base: SavedState): SavedState {
    if (!isRecord(value)) return base;
    return {
        alarms: Array.isArray(value.alarms) ? value.alarms.filter(validateAlarm) : base.alarms,
        activeId: typeof value.activeId === 'string' || value.activeId === null ? value.activeId : base.activeId,
        snoozeUntil: validNumber(value.snoozeUntil, base.snoozeUntil),
        score: validNumber(value.score, base.score),
        xp: validNumber(value.xp, base.xp),
        debt: validNumber(value.debt, base.debt),
        debtAt: validNumber(value.debtAt, base.debtAt),
        balance: validNumber(value.balance, base.balance),
        snoozes: validNumber(value.snoozes, base.snoozes),
        volume: Math.max(0, Math.min(100, validNumber(value.volume, base.volume))),
        premium: validBoolean(value.premium, base.premium),
        dlc: validBoolean(value.dlc, base.dlc),
        sound: value.sound === 'chime' ? 'chime' : 'standard',
        receipts: Array.isArray(value.receipts) ? value.receipts.filter(validateReceipt) : base.receipts,
        encounters: validNumberMap(value.encounters),
        completed: validBooleanMap(value.completed),
        daily: validString(value.daily, base.daily),
        rewardDay: validString(value.rewardDay, base.rewardDay),
        cookies: typeof value.cookies === 'boolean' || value.cookies === null ? value.cookies : base.cookies,
        accessibility: validBoolean(value.accessibility, base.accessibility),
        expired: validBoolean(value.expired, base.expired),
        verifiedDay: validString(value.verifiedDay, base.verifiedDay),
        attempts: validNumber(value.attempts, base.attempts),
        lockedUntil: validNumber(value.lockedUntil, base.lockedUntil),
        region: validString(value.region, base.region),
        updated: validBoolean(value.updated, base.updated),
        drmUntil: validNumber(value.drmUntil, base.drmUntil),
        maintenanceUntil: validNumber(value.maintenanceUntil, base.maintenanceUntil),
        paperwork: isRecord(value.paperwork) && typeof value.paperwork.reference === 'string'
            && typeof value.paperwork.due === 'number' && Number.isFinite(value.paperwork.due)
            ? {reference: value.paperwork.reference, due: value.paperwork.due} : null,
        device: validString(value.device, base.device),
        pendingSnooze: value.pendingSnooze === 'snooze' || value.pendingSnooze === 'loot' ? value.pendingSnooze : null,
        pendingSurvey: validBoolean(value.pendingSurvey, base.pendingSurvey)
    };
}

/* Legacy Migration */

function migrateLegacyState(
    legacy: Record<string, unknown>,
    base: SavedState,
): SavedState {
    const time = typeof legacy.alarmTime === 'string' && isValidAlarmTime(legacy.alarmTime)
        ? legacy.alarmTime : DEFAULT_ALARM_TIME;

    const alarms: Alarm[] = legacy.alarmEnabled === true
        ? [{
            id: crypto.randomUUID(),
            time,
            enabled: true,
            nextAt: nextAlarm(time),
        }]
        : [];

    return {
        ...base,
        score: validNumber(legacy.score, base.score),
        xp: validNumber(legacy.xp, base.xp),
        balance: Math.round(validNumber(legacy.balance, 25) * CENTS_PER_DOLLAR),
        debt: validNumber(legacy.debt, 0) * CENTS_PER_DOLLAR,
        premium: legacy.premium === true,
        volume: validNumber(legacy.volume, base.volume),
        snoozes: validNumber(legacy.snoozes, base.snoozes),
        alarms,
    };
}

function readLegacyState(base: SavedState): SavedState {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const legacy = parseStoredState(raw);

    if (!isRecord(legacy)) return base;

    return sanitizeSavedState(migrateLegacyState(legacy, base), base);
}

/* Storage Operations */

export function readState(): SavedState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return readLegacyState(createInitialState());
        }

        const saved = parseStoredState(raw);

        return sanitizeSavedState(saved, createInitialState());
    } catch {
        return createInitialState();
    }
}


export function writeState(state: SavedState): boolean {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state),
        );

        return true;
    } catch {
        return false;
    }
}

export function resetState(): SavedState {
    const fresh = createInitialState();

    // A reset is successful only when the fresh state has actually been persisted.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_FEATURES_KEY);
    return fresh;
}

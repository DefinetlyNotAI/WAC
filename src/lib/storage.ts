
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

type LegacyState = {
    alarmTime?: string;
    alarmEnabled?: boolean;
    score?: number;
    xp?: number;
    balance?: number;
    debt?: number;
    premium?: boolean;
    volume?: number;
    snoozes?: number;
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

function isValidSavedState(value: unknown): value is SavedState {
    if (!isRecord(value)) return false;

    return Array.isArray(value.alarms)
        && Array.isArray(value.receipts)
        && typeof value.balance === 'number'
        && Number.isFinite(value.balance);
}

function getNextAlarmTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduled = new Date();

    scheduled.setHours(hours, minutes, 0, 0);

    if (scheduled.getTime() <= Date.now()) {
        scheduled.setDate(scheduled.getDate() + 1);
    }

    return scheduled.getTime();
}

/* Legacy Migration */

function migrateLegacyState(
    legacy: LegacyState,
    base: SavedState,
): SavedState {
    const time = legacy.alarmTime || DEFAULT_ALARM_TIME;

    const alarms: Alarm[] = legacy.alarmEnabled
        ? [{
            id: crypto.randomUUID(),
            time,
            enabled: true,
            nextAt: getNextAlarmTime(time),
        }]
        : [];

    return {
        ...base,
        score: legacy.score ?? base.score,
        xp: legacy.xp ?? base.xp,
        balance: Math.round(
            (legacy.balance ?? 25) * CENTS_PER_DOLLAR
        ),
        debt: (legacy.debt ?? 0) * CENTS_PER_DOLLAR,
        premium: Boolean(legacy.premium),
        volume: legacy.volume ?? base.volume,
        snoozes: legacy.snoozes ?? base.snoozes,
        alarms,
    };
}

function readLegacyState(base: SavedState): SavedState {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const legacy = parseStoredState(raw);

    if (!isRecord(legacy)) return base;

    return migrateLegacyState(legacy as LegacyState, base);
}

/* Storage Operations */

export function readState(): SavedState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return readLegacyState(createInitialState());
        }

        const saved = parseStoredState(raw);

        if (!isValidSavedState(saved)) {
            return createInitialState();
        }

        return {
            ...createInitialState(),
            ...saved,
        };
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

    try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_FEATURES_KEY);
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(fresh),
        );
    } catch {
        // Return the fresh state even if storage is unavailable.
    }

    return fresh;
}

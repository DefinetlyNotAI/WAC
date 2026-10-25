
/* Types */

export type InvoiceLine = {
    label: string;
    cents: number;
};

export type Invoice = {
    lines: InvoiceLine[];
    total: number;
};

export type Captcha = {
    prompt: string;
    tiles: string[];
    correct: number[];
};

/* Constants */

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const CENTS_PER_DOLLAR = 100;
const REQUIRED_WORD_COUNT = 500;
const MINIMUM_GRATUITY = 30;

const SNOOZE_BASE_PRICE = 99;
const MAX_SNOOZE_EXPONENT = 30;

const ANNUAL_INTEREST_RATE = 0.2999;
const MINUTES_PER_YEAR = 365 * 24 * 60;

const PEAK_SURCHARGE = 0.75;

const INVOICE_FEES: readonly InvoiceLine[] = [
    { label: 'Processing fee', cents: 149 },
    { label: 'Convenience fee', cents: 69 },
    { label: 'Digital service fee', cents: 99 },
    { label: 'Fee fee', cents: 47 },
    { label: 'Fee fii fo fum fee', cents: 86 },
    { label: 'Alarm infrastructure fee', cents: 199 },
    { label: 'Inconvenience fee', cents: 42 },
];

const CAPTCHA_ICONS = [
    '🚦', '🚲', '🚌', '🌳', '🏠', '🚕',
] as const;

const CAPTCHA_NAMES = [
    'traffic lights',
    'bicycles',
    'buses',
    'trees',
    'houses',
    'taxis',
] as const;

const CAPTCHA_TILE_COUNT = 9;
const MATH_CAPTCHA_PROBABILITY = 0.33;

/* Internal Helpers */

function randomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

function isBusinessDay(date: Date): boolean {
    const day = date.getDay();
    return day !== 0 && day !== 6;
}

function creditMultiplier(score: number): number {
    if (score < 500) return 1.5;
    if (score < 600) return 1.25;
    return 1;
}

function createMathCaptcha(): Captcha {
    const a = 2 + randomInt(18);
    const b = 1 + randomInt(12);

    const answer = a + b;
    const correct = randomInt(CAPTCHA_TILE_COUNT);

    const tiles = Array.from(
        { length: CAPTCHA_TILE_COUNT },
        (_, index) => String(
            index === correct
                ? answer
                : answer + index - correct
        ),
    );

    return {
        prompt: `Select ${a} + ${b}. Calculators must also prove they are human.`,
        tiles,
        correct: [correct],
    };
}

function createIconCaptcha(): Captcha {
    const target = randomInt(CAPTCHA_ICONS.length);

    const tiles = Array.from(
        { length: CAPTCHA_TILE_COUNT },
        () => randomInt(CAPTCHA_ICONS.length),
    );

    tiles[randomInt(CAPTCHA_TILE_COUNT)] = target;

    const prompt = Math.random() < 0.5
        ? `Select every ${CAPTCHA_ICONS[target]}. Ignore any objects pretending to be one.`
        : `Select all ${CAPTCHA_NAMES[target]}. Our contractor has misplaced the road again.`;

    return {
        prompt,
        tiles: tiles.map(index => CAPTCHA_ICONS[index]),
        correct: tiles.flatMap((value, index) =>
            value === target ? [index] : []
        ),
    };
}

/* Formatting & Validation */

export function money(cents: number): string {
    return currencyFormatter.format(cents / CENTS_PER_DOLLAR);
}

export function wordCount(text: string): number {
    return text.trim().split(/\s+/u).filter(Boolean).length;
}

export function validApplication(text: string): boolean {
    return wordCount(text) === REQUIRED_WORD_COUNT;
}

export function validGratuity(percent: number): boolean {
    return percent >= MINIMUM_GRATUITY;
}

/* Alarm Scheduling */

export function nextAlarm(
    time: string,
    now = Date.now(),
): number {
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    if (next.getTime() <= now) {
        next.setDate(next.getDate() + 1);
    }

    return next.getTime();
}

/* Pricing & Credit */

export function snoozePrice(
    count: number,
    score: number,
): number {
    const exponent = Math.min(count, MAX_SNOOZE_EXPONENT);
    const multiplier = creditMultiplier(score);

    return Math.round(
        SNOOZE_BASE_PRICE * 2 ** exponent * multiplier
    );
}

export function freeDismissal(
    hour: number,
    score: number,
): boolean {
    const closingHour = score < 500 ? 12 : 17;
    return hour >= 9 && hour < closingHour;
}

export function accrueDebt(
    cents: number,
    minutes: number,
): number {
    const rate = ANNUAL_INTEREST_RATE / MINUTES_PER_YEAR;
    const growth = (1 + rate) ** minutes;

    return cents * growth + (growth - 1) / rate;
}

/* Invoicing */

export function invoice(
    base: number,
    peak: boolean,
    tip = 0,
): Invoice {
    const lines: InvoiceLine[] = [
        { label: 'Service charge', cents: base },
    ];

    if (peak) {
        lines.push({
            label: 'Peak wakefulness adjustment (75%)',
            cents: Math.round(base * PEAK_SURCHARGE),
        });
    }

    lines.push(...INVOICE_FEES);

    if (tip) {
        lines.push({
            label: `Alarm gratuity (${tip}%)`,
            cents: Math.round(base * tip / 100),
        });
    }

    const total = lines.reduce(
        (sum, line) => sum + line.cents,
        0,
    );

    return { lines, total };
}

/* Business Dates */

export function businessDue(
    days: number,
    now = Date.now(),
): number {
    const date = new Date(now);

    while (days > 0) {
        date.setDate(date.getDate() + 1);

        if (isBusinessDay(date)) {
            days--;
        }
    }

    return date.getTime();
}

/* CAPTCHA */

export function makeCaptcha(): Captcha {
    return Math.random() < MATH_CAPTCHA_PROBABILITY
        ? createMathCaptcha()
        : createIconCaptcha();
}

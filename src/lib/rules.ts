export const money = (cents: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
}).format(cents / 100);
export const wordCount = (text: string) => text.trim().split(/\s+/u).filter(Boolean).length;
export const validApplication = (text: string) => wordCount(text) === 500;
export const validGratuity = (percent: number) => percent >= 30;

export function nextAlarm(time: string, now = Date.now()): number {
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    if (next.getTime() <= now) next.setDate(next.getDate() + 1);
    return next.getTime();
}

export function snoozePrice(count: number, score: number): number {
    return Math.round(99 * 2 ** Math.min(count, 30) * (score < 500 ? 1.5 : score < 600 ? 1.25 : 1));
}

export function freeDismissal(hour: number, score: number): boolean {
    return hour >= 9 && hour < (score < 500 ? 12 : 17);
}

export function accrueDebt(cents: number, minutes: number): number {
    const rate = .2999 / (365 * 24 * 60);
    return cents * (1 + rate) ** minutes + ((1 + rate) ** minutes - 1) / rate;
}

export function invoice(base: number, peak: boolean, tip = 0) {
    const lines = [{label: 'Service charge', cents: base}];
    if (peak) lines.push({label: 'Peak wakefulness adjustment (75%)', cents: Math.round(base * .75)});
    lines.push(...[{label: 'Processing fee', cents: 149}, {
        label: 'Convenience fee',
        cents: 69
    }, {label: 'Digital service fee', cents: 99}, {label: 'Fee fee', cents: 47}, {
        label: 'Fee fii fo fum fee',
        cents: 86
    }, {label: 'Alarm infrastructure fee', cents: 199}, {label: 'Inconvenience fee', cents: 42}]);
    if (tip) lines.push({label: `Alarm gratuity (${tip}%)`, cents: Math.round(base * tip / 100)});
    return {lines, total: lines.reduce((sum, line) => sum + line.cents, 0)};
}

export function businessDue(days: number, now = Date.now()) {
    const date = new Date(now);
    while (days > 0) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) days--;
    }
    return date.getTime();
}

export function makeCaptcha() {
    if (Math.random() < .33) {
        const a = 2 + Math.floor(Math.random() * 18), b = 1 + Math.floor(Math.random() * 12);
        const answer = a + b, correct = Math.floor(Math.random() * 9);
        const tiles = Array.from({length: 9}, (_, i) => String(i === correct ? answer : answer + i - correct));
        return {prompt: `Select ${a} + ${b}. Calculators must also prove they are human.`, tiles, correct: [correct]};
    }
    const icons = ['🚦', '🚲', '🚌', '🌳', '🏠', '🚕'];
    const names = ['traffic lights', 'bicycles', 'buses', 'trees', 'houses', 'taxis'];
    const target = Math.floor(Math.random() * icons.length);
    const tiles = Array.from({length: 9}, () => Math.floor(Math.random() * icons.length));
    tiles[Math.floor(Math.random() * 9)] = target;
    return {
        prompt: Math.random() < .5 ? `Select every ${icons[target]}. Ignore any objects pretending to be one.` : `Select all ${names[target]}. Our contractor has misplaced the road again.`,
        tiles: tiles.map(i => icons[i]),
        correct: tiles.flatMap((v, i) => v === target ? [i] : [])
    };
}

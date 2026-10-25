'use client';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { type Alarm, initialState, readState, resetState, type SavedState, writeState } from '@/lib/storage.ts';
import { accrueDebt, freeDismissal, invoice, makeCaptcha, nextAlarm, snoozePrice, validGratuity } from '@/lib/rules.ts';
import { armAudio, disposeAudio, setAlarmVolume, startAlarmSound, stopAlarmSound } from '@/lib/audio.ts';
import { totp } from '@/lib/totp.ts';
import type { Checkout, Gate, Page, Product } from '@/app/page.types.ts';
import { day } from '@/app/config.ts';

export function useAlarmController() {
    const [state, setState] = useState<SavedState>(initialState);
    const [ready, setReady] = useState(false);
    const [login, setLogin] = useState(0);
    const [inside, setInside] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [page, setPage] = useState<Page>('alarms');
    const [gate, setGate] = useState<Gate>(null);
    const [step, setStep] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [now, setNow] = useState(0);
    const [fast, setFast] = useState(false);
    const [tools, setTools] = useState(false);
    const [input, setInput] = useState('');
    const [code, setCode] = useState('');
    const [round, setRound] = useState(0);
    const [captcha, setCaptcha] = useState<ReturnType<typeof makeCaptcha> | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [captchaFor, setCaptchaFor] = useState<'accessibility' | 'paperwork'>('accessibility');
    const [editor, setEditor] = useState<Alarm | null>(null);
    const [checkout, setCheckout] = useState<Checkout | null>(null);
    const [tip, setTip] = useState(0);
    const [decline, setDecline] = useState(false);
    const [audio, setAudio] = useState(false);
    const [queue, setQueue] = useState(14892);
    const [privacyY, setPrivacyY] = useState(0);
    const [privacyEnd, setPrivacyEnd] = useState(false);
    const [online, setOnline] = useState(true);
    const [dismissing, setDismissing] = useState(false);
    const [captchaOrder, setCaptchaOrder] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const [refusalPosition, setRefusalPosition] = useState<{ x: number; y: number } | null>(null);
    const refusalRef = useRef<HTMLButtonElement>(null);
    const afterSurvey = useRef<() => void>(() => {
    });
    const sessionVersion = useRef(0);
    const networkRetry = useRef<() => Promise<void>>(async () => {
    });
    const privacyRef = useRef<HTMLDivElement>(null);
    const resume = useRef<() => void>(() => {
    });
    const pendingSnooze = useRef<'snooze' | 'loot'>('snooze');
    const paidSnooze = useRef(false);
    const paying = useRef(false);
    const level = Math.floor(state.xp / 100) + 1;
    const ringing = !!state.activeId && !state.snoozeUntil;
    const update = (patch: Partial<SavedState>) => setState(s => ({...s, ...patch}));
    const notify = (text: string) => setMessage(text);

    function encounter(id: string) {
        setState(s => ({...s, encounters: {...s.encounters, [id]: (s.encounters[id] || 0) + 1}}));
    }

    function complete(id: string) {
        setState(s => ({...s, completed: {...s.completed, [id]: true}}));
    }

    function open(next: Gate) {
        setEditor(null);
        setRefusalPosition(null);
        setGate(next);
        setStep(0);
        setElapsed(0);
        setInput('');
        setRound(0);
        if (next) encounter(next);
        if (next === 'captcha') {
            setCaptcha(makeCaptcha());
            setSelected([]);
            setCaptchaOrder([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        }
        if (next === 'privacy') {
            setPrivacyY(0);
            setPrivacyEnd(false);
        }
        if (next === 'queue') setQueue(14892);
        if (next === 'totp') void refreshCode();
    }

    async function refreshCode() {
        const version = sessionVersion.current;
        const next = await totp();
        if (version === sessionVersion.current) setCode(next);
    }

    function close() {
        if (gate === 'survey' || (gate === 'rating' && (paidSnooze.current || state.pendingSnooze))) {
            notify(gate === 'survey' ? 'Complete the required feedback before continuing.' : 'Your snooze is awaiting a five-star rating.');
            return;
        }
        setDismissing(false);
        setGate(null);
    }

    function dailyThen(action: () => void) {
        resume.current = action;
        if (state.daily !== day()) open('onboarding'); else action();
    }

    async function enableAudio() {
        const version = sessionVersion.current;
        try {
            const armed = await armAudio();
            if (version === sessionVersion.current) setAudio(armed);
        } catch {
            if (version === sessionVersion.current) notify('Select Enable sound again to allow browser audio.');
        }
    }

    function afterForm(next: () => void) {
        afterSurvey.current = next;
        update({pendingSurvey: true});
        open('survey');
    }

    useEffect(() => {
        let stopped = false, checking = false;
        const controller = new AbortController();

        async function check() {
            if (checking) return;
            checking = true;
            try {
                const response = await fetch('/api/network', {cache: 'no-store', signal: controller.signal});
                const result = await response.json();
                if (!stopped) setOnline(navigator.onLine && (result.connected ?? navigator.onLine));
            } catch {
                if (!stopped) setOnline(false);
            } finally {
                checking = false;
            }
        }

        networkRetry.current = check;
        void check();
        const timer = setInterval(() => void check(), 1000);
        return () => {
            stopped = true;
            controller.abort();
            clearInterval(timer);
        };
    }, []);
    useEffect(() => {
        if (gate !== 'captcha') return;
        const timer = setInterval(() => {
            setCaptchaOrder(order => {
                const next = [...order], first = Math.floor(Math.random() * 9);
                const second = (first + 1 + Math.floor(Math.random() * 8)) % 9;
                [next[first], next[second]] = [next[second], next[first]];
                return next;
            });
            if (Math.random() < .3) {
                setCaptcha(makeCaptcha());
                setSelected([]);
            }
        }, 1800);
        return () => clearInterval(timer);
    }, [gate]);
    useEffect(() => {
        if (gate !== 'terms') return;
        const flee = (e: PointerEvent) => {
            const rect = refusalRef.current?.getBoundingClientRect();
            if (!rect || e.clientX < rect.left - 80 || e.clientX > rect.right + 80 || e.clientY < rect.top - 60 || e.clientY > rect.bottom + 60) return;
            let x = 12, y = 12;
            for (let i = 0; i < 30; i++) {
                x = 12 + Math.random() * Math.max(0, innerWidth - rect.width - 24);
                y = 12 + Math.random() * Math.max(0, innerHeight - rect.height - 24);
                if (Math.hypot(x + rect.width / 2 - e.clientX, y + rect.height / 2 - e.clientY) > 180) break;
            }
            setRefusalPosition({x, y});
        };
        window.addEventListener('pointermove', flee);
        return () => window.removeEventListener('pointermove', flee);
    }, [gate]);
    useEffect(() => {
        if (inside && dismissing && !gate && !checkout && online && ringing) authorizeDismissal();
    }, [inside, dismissing, gate, checkout, online, state]);
    useEffect(() => {
        setState(readState());
        setNow(Date.now());
        setReady(true);
    }, []);
    useEffect(() => {
        if (ready && !writeState(state)) setMessage('Browser storage is unavailable. This session cannot survive refresh.');
    }, [ready, state]);
    useEffect(() => {
        if (!ready) return;
        const timer = setInterval(() => {
            const time = Date.now();
            setNow(time);
            setState(s => {
                let next = s;
                if (s.activeId && s.debtAt) next = {
                    ...next,
                    debt: accrueDebt(s.debt, (time - s.debtAt) / 60000),
                    debtAt: time
                };
                if (s.snoozeUntil && time >= s.snoozeUntil) next = {...next, snoozeUntil: 0, expired: true};
                if (!s.activeId) {
                    const alarm = s.alarms.find(a => a.enabled && a.nextAt <= time);
                    if (alarm) next = {
                        ...next,
                        activeId: alarm.id,
                        debtAt: time,
                        expired: true,
                        alarms: s.alarms.map(a => a.id === alarm.id ? {...a, nextAt: nextAlarm(a.time, time)} : a),
                        completed: {...s.completed, 'dismiss-fake': false, ads: false, maintenance: false}
                    };
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [ready]);
    useEffect(() => {
        if (ringing && audio) void startAlarmSound(state.volume, state.sound).catch(() => setAudio(false)); else stopAlarmSound();
    }, [ringing, audio, state.volume, state.sound]);
    useEffect(() => () => {
        void disposeAudio();
    }, []);
    useEffect(() => {
        const shortcut = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
                e.preventDefault();
                setTools(t => !t);
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, []);
    useEffect(() => {
        if (!gate) return;
        const timer = setInterval(() => {
            const seconds = fast ? 120 : 1;
            setElapsed(t => t + seconds);
            if (gate === 'queue') setQueue(q => Math.max(0, q - (fast ? 5000 : state.completed.priority ? 3000 : 250)));
            if (gate === 'privacy') setPrivacyY(y => y + seconds);
            if (gate === 'totp') void refreshCode();
        }, 1000);
        return () => clearInterval(timer);
    }, [gate, fast, state.completed.priority]);
    useEffect(() => {
        const box = privacyRef.current;
        if (gate === 'privacy' && box) {
            box.scrollTop = privacyY;
            setPrivacyEnd(privacyY >= box.scrollHeight - box.clientHeight);
        }
    }, [privacyY, gate]);

    function trigger() {
        void enableAudio();
        paidSnooze.current = false;
        setState(s => ({
            ...s,
            activeId: s.alarms[0]?.id || 'presenter',
            snoozeUntil: 0,
            pendingSnooze: null,
            debtAt: Date.now(),
            expired: true,
            attempts: 0,
            completed: {...s.completed, 'dismiss-fake': false, ads: false, maintenance: false}
        }));
        setPage('alarms');
    }

    function silence() {
        if (!online) {
            open('drm');
            return;
        }
        setDismissing(false);
        stopAlarmSound();
        update({activeId: null, snoozeUntil: 0, debtAt: 0, pendingSnooze: null});
        setState(s => ({...s, xp: s.xp + 25}));
        setGate(null);
        notify('Dismissal authorized. Your next scheduled alarm remains enabled.');
    }

    function dismiss() {
        if (!ringing) return;
        encounter('credit');
        encounter('debt');
        if (!online) {
            open('drm');
            return;
        }
        dailyThen(() => setDismissing(true));
    }

    function authorizeDismissal() {
        if (!online) {
            open('drm');
            return;
        }
        if (state.expired) {
            open('password-expiry');
            return;
        }
        if (state.verifiedDay !== day()) {
            open('device');
            return;
        }
        if (!state.premium && !freeDismissal(new Date().getHours(), state.score)) {
            open('premium');
            return;
        }
        if (state.cookies === false) {
            open('cookies');
            return;
        }
        if (state.drmUntil < Date.now()) {
            open('drm');
            return;
        }
        if (!state.updated) {
            open('update');
            return;
        }
        if (!state.completed.maintenance) {
            update({maintenanceUntil: Date.now() + 15000});
            open('maintenance');
            return;
        }
        if (state.maintenanceUntil > Date.now()) {
            open('maintenance');
            return;
        }
        if (new Date().getMinutes() % 30 === 0 && new Date().getSeconds() < 20) {
            update({maintenanceUntil: Date.now() + 20000});
            open('maintenance');
            return;
        }
        if (!state.premium && !state.completed.banner) {
            open('banner');
            return;
        }
        if (!state.completed.ads) {
            open('ads');
            return;
        }
        if (!state.completed['dismiss-fake']) {
            encounter('fake-dismiss');
            setState(s => ({
                ...s,
                alarms: [...s.alarms, {
                    id: crypto.randomUUID(),
                    time: new Date().toTimeString().slice(0, 5),
                    enabled: true,
                    nextAt: nextAlarm(new Date().toTimeString().slice(0, 5))
                }],
                completed: {...s.completed, 'dismiss-fake': true}
            }));
            notify('Dismiss created a reminder for tomorrow. This alarm remains active; request dismissal again.');
            return;
        }
        if (!state.paperwork) {
            setCaptchaFor('paperwork');
            open('captcha');
            return;
        }
        if (state.paperwork && state.paperwork.due > Date.now()) {
            open('paperwork');
            return;
        }
        open('queue');
    }

    function purchase(kind: Product) {
        const data = {
            snooze: ['Five-minute snooze', snoozePrice(state.snoozes, state.score)],
            loot: ['Random snooze crate · 0–60 seconds', 299],
            premium: ['WakeUp Premium · first month', 2999],
            dlc: ['Peace & Quiet · perpetual device license', 4999],
            priority: ['Priority dismissal placement', 999],
            dismiss: ['Alarm dismissal authorization', 99]
        } as const;
        if ((kind === 'snooze' || kind === 'loot') && !ringing) {
            notify('A snooze requires an active alarm.');
            return;
        }
        encounter('fees');
        if (kind === 'snooze') encounter('pay-snooze');
        if (kind === 'loot') encounter('lootbox');
        const hour = new Date().getHours();
        const peak = kind === 'dismiss' && hour >= 5 && hour < 9;
        if (peak) encounter('surge');
        if (kind === 'dismiss') encounter('tip');
        setCheckout({
            kind,
            title: data[kind][0],
            base: data[kind][1],
            peak,
            id: `WAC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
        });
        setTip(0);
        setDecline(false);
        paying.current = false;
        setGate(null);
    }

    function pay() {
        if (!checkout || checkout.paid || paying.current) return;
        if (checkout.kind === 'dismiss' && !online) {
            setCheckout(null);
            open('drm');
            return;
        }
        if (checkout.kind === 'dismiss' && !validGratuity(tip)) {
            notify('Gratuity rejected. The minimum service appreciation is 30%.');
            return;
        }
        if (decline) {
            notify('PAY-402: The wallet declined this request. Select another payment method to retry.');
            return;
        }
        paying.current = true;
        const receipt = {
            ...invoice(checkout.base, checkout.peak, tip),
            id: checkout.id,
            title: checkout.title,
            at: Date.now()
        };
        setState(s => ({
            ...s,
            balance: s.balance - receipt.total,
            receipts: [receipt, ...s.receipts],
            premium: s.premium || checkout.kind === 'premium',
            dlc: s.dlc || checkout.kind === 'dlc',
            pendingSnooze: checkout.kind === 'snooze' || checkout.kind === 'loot' ? checkout.kind : s.pendingSnooze
        }));
        setCheckout({...checkout, paid: receipt});
        complete(checkout.kind);
        if (checkout.kind === 'dismiss') silence();
        if (checkout.kind === 'dlc') update({volume: 0});
        if (checkout.kind === 'snooze' || checkout.kind === 'loot') {
            pendingSnooze.current = checkout.kind;
            paidSnooze.current = true;
        }
    }

    function returnFromPayment() {
        if (!checkout) return;
        const kind = checkout.kind;
        setCheckout(null);
        if (kind === 'dismiss') notify('Your dismissal receipt is available in Billing.');
        else if (kind === 'snooze' || kind === 'loot') open('rating');
        else if (kind === 'priority') open('queue');
        else if (kind === 'dlc') {
            update({volume: 0});
            setAlarmVolume(0);
            notify('Peace & Quiet installed. Output muted.');
        } else notify('Premium activated. Request dismissal to continue.');
    }

    function activateSnooze() {
        const seconds = (state.pendingSnooze || pendingSnooze.current) === 'loot' ? Math.floor(Math.random() * 61) : 300;
        update({snoozeUntil: seconds ? Date.now() + seconds * 1000 : 0, pendingSnooze: null});
        setState(s => ({...s, snoozes: s.snoozes + 1, score: Math.max(0, s.score - 35), xp: s.xp + 5}));
        encounter('credit');
        encounter('debt');
        paidSnooze.current = false;
        complete('rating');
        setGate(null);
        notify(`Rating accepted. ${seconds} seconds awarded; credit score reduced by 35.`);
    }

    function snooze(kind: 'snooze' | 'loot') {
        if (!ringing) {
            notify('A snooze requires an active alarm.');
            return;
        }
        pendingSnooze.current = kind;
        if (['JO', 'GB'].includes(state.region.toUpperCase())) open('region'); else purchase(kind);
    }

    function saveAlarm() {
        if (!editor || !/^\d{2}:\d{2}$/.test(editor.time)) return;
        if (state.score < 500 && editor.time > '06:00') {
            encounter('credit');
            notify('Credit policy CR-500 restricts new wake-up times to 06:00 or earlier.');
            return;
        }
        const saved = {...editor, nextAt: nextAlarm(editor.time)};
        setState(s => ({...s, alarms: [...s.alarms.filter(a => a.id !== saved.id), saved]}));
        setEditor(null);
        afterForm(() => open('sync'));
    }

    function exportStatement() {
        const blob = new Blob([JSON.stringify(state.receipts, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wakeup-statement.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function signOut() {
        if (!state.lockedUntil) {
            update({lockedUntil: Date.now() + 7 * 86400000});
            open('rate');
            return;
        }
        if (state.lockedUntil > Date.now()) {
            open('rate');
            return;
        }
        setInside(false);
        setLogin(0);
        setGate(null);
        setCheckout(null);
        setEditor(null);
        setDismissing(false);
        update({lockedUntil: 0});
    }

    const stars = (value: number, rate: (n: number) => void) => <div className="star-rating" role="group"
                                                                     aria-label="Service rating">{[1, 2, 3, 4, 5].map(n =>
        <button type="button" key={n} aria-label={`Rate ${n} ${n === 1 ? 'star' : 'stars'}`} aria-pressed={value === n}
                onClick={() => rate(n)}><Star size={32} fill={n <= value ? 'currentColor' : 'none'}/></button>)}</div>;

    function resetSession() {
        sessionVersion.current++;
        paying.current = false;
        paidSnooze.current = false;
        resume.current = () => {
        };
        afterSurvey.current = () => {
        };
        pendingSnooze.current = 'snooze';
        stopAlarmSound();
        setAudio(false);
        setDismissing(false);
        try {
            setState(resetState());
        } catch {
            notify('Storage could not be cleared. Check browser storage permissions.');
            return;
        }
        setPage('alarms');
        setFast(false);
        setTools(false);
        setGate(null);
        setCheckout(null);
        setEditor(null);
        setInside(false);
        setLogin(0);
        setPassword('');
        setEmail('');
        setMessage('');
        setInput('');
        setCode('');
        setRound(0);
        setStep(0);
        setElapsed(0);
        setTip(0);
        setDecline(false);
        setCaptcha(null);
        setSelected([]);
        setCaptchaFor('accessibility');
        setCaptchaOrder([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        setRefusalPosition(null);
        setPrivacyY(0);
        setPrivacyEnd(false);
        setQueue(14892);
        setNow(Date.now());
    }

    function showFeature(id: string) {
        if (id === 'survey') {
            setTools(false);
            afterForm(() => {
            });
            return;
        }
        setTools(false);
        if (['surge', 'tip', 'fees', 'battlepass', 'debt', 'credit', 'account', 'fake-dismiss', 'volume', 'lootbox', 'pay-snooze'].includes(id)) encounter(id);
        if (['pay-snooze', 'lootbox'].includes(id)) {
            if (!ringing) trigger();
            pendingSnooze.current = id === 'lootbox' ? 'loot' : 'snooze';
            open('region');
            return;
        }
        if (['surge', 'tip', 'fees'].includes(id)) {
            purchase('dismiss');
            if (id === 'surge') setCheckout(c => c ? {...c, peak: true} : c);
            return;
        }
        if (id === 'battlepass') {
            setPage('rewards');
            return;
        }
        if (id === 'debt' || id === 'credit') {
            setPage('billing');
            return;
        }
        if (id === 'account') {
            setInside(false);
            setLogin(0);
            return;
        }
        if (id === 'fake-dismiss') {
            trigger();
            setState(s => ({
                ...s,
                expired: false,
                verifiedDay: day(),
                daily: day(),
                premium: true,
                updated: true,
                drmUntil: Date.now() + 86400000,
                cookies: true,
                completed: {...s.completed, ads: true, 'dismiss-fake': false}
            }));
            return;
        }
        if (id === 'volume') {
            update({volume: Math.min(100, state.volume + 10)});
            notify('Negative numbers are not supported. Volume increased.');
            open('sync');
            return;
        }
        if (id === 'maintenance') update({maintenanceUntil: Date.now() + 30000});
        if (id === 'rate') update({lockedUntil: Date.now() + 7 * 86400000});
        if (id === 'rating') {
            trigger();
            pendingSnooze.current = 'snooze';
            paidSnooze.current = true;
            update({pendingSnooze: 'snooze'});
            open('rating');
            return;
        }
        if (id === 'region') {
            if (!ringing) trigger();
            pendingSnooze.current = 'snooze';
        }
        open(id as Gate);
    }

    const button = (label: string, action: () => void, disabled = false, secondary = false) => <button type="button"
                                                                                                       className={`button${secondary ? ' secondary' : ''}`}
                                                                                                       disabled={disabled}
                                                                                                       onClick={action}>{label}</button>;
    const row = (label: string, description: string, control: ReactNode) => <div className="setting-row">
        <div><strong>{label}</strong><p>{description}</p></div>
        {control}</div>;

    return {
state, setState, ready, setReady, login, setLogin, inside, setInside, email, setEmail, password, setPassword, message, setMessage, page, setPage, gate, setGate, step, setStep, elapsed, setElapsed, now, setNow, fast, setFast, tools, setTools, input, setInput, code, setCode, round, setRound, captcha, setCaptcha, selected, setSelected, captchaFor, setCaptchaFor, editor, setEditor, checkout, setCheckout, tip, setTip, decline, setDecline, audio, setAudio, queue, setQueue, privacyY, setPrivacyY, privacyEnd, setPrivacyEnd, online, setOnline, dismissing, setDismissing, captchaOrder, setCaptchaOrder, refusalPosition, setRefusalPosition, refusalRef, afterSurvey, sessionVersion, networkRetry, privacyRef, resume, pendingSnooze, paidSnooze, paying, level, ringing, update, notify, encounter, complete, open, close, dailyThen, enableAudio, afterForm, trigger, dismiss, purchase, pay, returnFromPayment, activateSnooze, snooze, saveAlarm, exportStatement, signOut, stars, resetSession, showFeature, button, row
    };
}

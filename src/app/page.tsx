'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlarmClock, Bell, CreditCard, Settings2, ShieldCheck, CircleHelp, X, Volume2, VolumeX, LogOut } from 'lucide-react';
import { initialState, readState, writeState, resetState, type SavedState, type Alarm, type Receipt } from '@/lib/storage';
import { accrueDebt, businessDue, freeDismissal, invoice, makeCaptcha, money, nextAlarm, snoozePrice, validApplication, validGratuity, wordCount } from '@/lib/rules';
import { armAudio, disposeAudio, setAlarmVolume, startAlarmSound, stopAlarmSound } from '@/lib/audio';
import { totp } from '@/lib/totp';
import { features } from '@/lib/features';
import { terms, privacy } from '@/lib/legal';

type Page = 'alarms' | 'billing' | 'rewards' | 'settings' | 'support';
type Gate = 'startup' | 'onboarding' | 'terms' | 'privacy' | 'cookies' | 'drm' | 'update' | 'sync' | 'device' | 'password-expiry' | 'totp' | 'captcha' | 'paperwork' | 'region' | 'premium' | 'banner' | 'ads' | 'queue' | 'maintenance' | 'rate' | 'rating' | 'dlc' | 'accessibility' | 'cancel' | 'reset' | 'survey' | null;
type Product = 'snooze' | 'loot' | 'premium' | 'dlc' | 'priority' | 'dismiss';
type Checkout = { kind: Product; title: string; base: number; peak: boolean; id: string; paid?: Receipt };
const day = () => new Date().toDateString();
const nav = [{ key: 'alarms', label: 'Alarms', icon: Bell }, { key: 'billing', label: 'Billing', icon: CreditCard }, { key: 'rewards', label: 'Rewards', icon: ShieldCheck }, { key: 'settings', label: 'Settings', icon: Settings2 }, { key: 'support', label: 'Support', icon: CircleHelp }] as const;
const titles: Record<NonNullable<Gate>, string> = {
  startup: 'Preparing your workspace', onboarding: 'Morning product orientation', terms: 'Service agreement', privacy: 'Privacy acknowledgment', cookies: 'Cookie control center', drm: 'License authorization', update: 'Required runtime update', sync: 'Cloud reconciliation', device: 'Verify this device', 'password-expiry': 'Your password has expired', totp: 'Five-round identity verification', captcha: 'Human verification', paperwork: 'Application for dismissal', region: 'Regional snooze license', premium: 'Extended dismissal hours', banner: 'Your free dismissal control', ads: 'A message from our partners', queue: 'Dismissal authorization queue', maintenance: 'Scheduled maintenance', rate: 'Request limit reached', rating: 'Please rate our app', dlc: 'Peace & Quiet Expansion', accessibility: 'Accessibility verification', cancel: 'Cancellation assistance', reset: 'Account recovery', survey: 'Required service feedback',
};

export default function Home() {
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
  const [captchaOffset, setCaptchaOffset] = useState({ x: 0, y: 0 });
  const [refusalPosition, setRefusalPosition] = useState<{ x: number; y: number } | null>(null);
  const refusalRef = useRef<HTMLButtonElement>(null);
  const afterSurvey = useRef<() => void>(() => {});
  const sessionVersion = useRef(0);
  const networkRetry = useRef<() => Promise<void>>(async () => {});
  const privacyRef = useRef<HTMLDivElement>(null);
  const resume = useRef<() => void>(() => {});
  const pendingSnooze = useRef<'snooze' | 'loot'>('snooze');
  const paidSnooze = useRef(false);
  const paying = useRef(false);
  const level = Math.floor(state.xp / 100) + 1;
  const ringing = !!state.activeId && !state.snoozeUntil;
  const update = (patch: Partial<SavedState>) => setState(s => ({ ...s, ...patch }));
  const notify = (text: string) => setMessage(text);
  function encounter(id: string) { setState(s => ({ ...s, encounters: { ...s.encounters, [id]: (s.encounters[id] || 0) + 1 } })); }
  function complete(id: string) { setState(s => ({ ...s, completed: { ...s.completed, [id]: true } })); }
  function open(next: Gate) {
    setEditor(null); setRefusalPosition(null); setGate(next); setStep(0); setElapsed(0); setInput(''); setRound(0);
    if (next) encounter(next);
    if (next === 'captcha') { setCaptcha(makeCaptcha()); setSelected([]); }
    if (next === 'privacy') { setPrivacyY(0); setPrivacyEnd(false); }
    if (next === 'queue') setQueue(14892);
    if (next === 'totp') void refreshCode();
  }
  async function refreshCode() {
    const version = sessionVersion.current;
    const next = await totp();
    if (version === sessionVersion.current) setCode(next);
  }
  function close() { if (gate === 'survey' || (gate === 'rating' && (paidSnooze.current || state.pendingSnooze))) { notify(gate === 'survey' ? 'Complete the required feedback before continuing.' : 'Your snooze is awaiting a five-star rating.'); return; } setDismissing(false); setGate(null); }
  function dailyThen(action: () => void) {
    resume.current = action;
    if (state.daily !== day()) open('onboarding'); else action();
  }
  async function enableAudio() {
    const version = sessionVersion.current;
    try { const armed = await armAudio(); if (version === sessionVersion.current) setAudio(armed); } catch { if (version === sessionVersion.current) notify('Select Enable sound again to allow browser audio.'); }
  }
  function afterForm(next: () => void) {
    afterSurvey.current = next; update({ pendingSurvey: true }); open('survey');
  }
  useEffect(() => {
    let stopped = false, checking = false;
    const controller = new AbortController();
    async function check() {
      if (checking) return;
      checking = true;
      try {
        const response = await fetch('/api/network', { cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        if (!stopped) setOnline(navigator.onLine && (result.connected ?? navigator.onLine));
      } catch { if (!stopped) setOnline(false); }
      finally { checking = false; }
    }
    networkRetry.current = check;
    void check(); const timer = setInterval(() => void check(), 1000);
    return () => { stopped = true; controller.abort(); clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (gate !== 'captcha') return;
    const timer = setInterval(() => {
      setCaptchaOffset({ x: Math.random() * 36 - 18, y: Math.random() * 30 - 15 });
      if (Math.random() < .3) { setCaptcha(makeCaptcha()); setSelected([]); }
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
      setRefusalPosition({ x, y });
    };
    window.addEventListener('pointermove', flee);
    return () => window.removeEventListener('pointermove', flee);
  }, [gate]);
  useEffect(() => {
    if (inside && dismissing && !gate && !checkout && online && ringing) authorizeDismissal();
  }, [inside, dismissing, gate, checkout, online, state]);
  useEffect(() => { setState(readState()); setNow(Date.now()); setReady(true); }, []);
  useEffect(() => { if (ready && !writeState(state)) setMessage('Browser storage is unavailable. This session cannot survive refresh.'); }, [ready, state]);
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      const time = Date.now(); setNow(time);
      setState(s => {
        let next = s;
        if (s.activeId && s.debtAt) next = { ...next, debt: accrueDebt(s.debt, (time - s.debtAt) / 60000), debtAt: time };
        if (s.snoozeUntil && time >= s.snoozeUntil) next = { ...next, snoozeUntil: 0, expired: true };
        if (!s.activeId) {
          const alarm = s.alarms.find(a => a.enabled && a.nextAt <= time);
          if (alarm) next = { ...next, activeId: alarm.id, debtAt: time, expired: true, attempts: 0, alarms: s.alarms.map(a => a.id === alarm.id ? { ...a, nextAt: nextAlarm(a.time, time) } : a), completed: { ...s.completed, 'dismiss-fake': false, ads: false, maintenance: false } };
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ready]);
  useEffect(() => {
    if (ringing && audio) void startAlarmSound(state.volume, state.sound).catch(() => setAudio(false)); else stopAlarmSound();
  }, [ringing, audio, state.volume, state.sound]);
  useEffect(() => () => { void disposeAudio(); }, []);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => { if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') { e.preventDefault(); setTools(t => !t); } };
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut);
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
    if (gate === 'privacy' && box) { box.scrollTop = privacyY; setPrivacyEnd(privacyY >= box.scrollHeight - box.clientHeight); }
  }, [privacyY, gate]);

  function trigger() {
    void enableAudio();
    paidSnooze.current = false;
    setState(s => ({ ...s, activeId: s.alarms[0]?.id || 'presenter', snoozeUntil: 0, pendingSnooze: null, debtAt: Date.now(), expired: true, attempts: 0, completed: { ...s.completed, 'dismiss-fake': false, ads: false, maintenance: false } }));
    setPage('alarms');
  }
  function silence() {
    if (!online || state.lockedUntil > Date.now()) { open(!online ? 'drm' : 'rate'); return; }
    setDismissing(false);
    stopAlarmSound(); update({ activeId: null, snoozeUntil: 0, debtAt: 0, attempts: 0, pendingSnooze: null });
    setState(s => ({ ...s, xp: s.xp + 25 })); setGate(null); notify('Dismissal authorized. Your next scheduled alarm remains enabled.');
  }
  function dismiss() {
    if (!ringing) return;
    encounter('credit'); encounter('debt');
    if (state.lockedUntil > Date.now()) { open('rate'); return; }
    const attempts = state.attempts + 1;
    update({ attempts, ...(attempts >= 6 ? { lockedUntil: Date.now() + 7 * 86400000 } : {}) });
    if (attempts >= 6) { open('rate'); return; }
    if (!online) { open('drm'); return; }
    dailyThen(() => setDismissing(true));
  }
  function authorizeDismissal() {
    if (!online) { open('drm'); return; }
    if (state.lockedUntil > Date.now()) { open('rate'); return; }
    if (state.expired) { open('password-expiry'); return; }
    if (state.verifiedDay !== day()) { open('device'); return; }
    if (!state.premium && !freeDismissal(new Date().getHours(), state.score)) { open('premium'); return; }
    if (state.cookies === false) { open('cookies'); return; }
    if (state.drmUntil < Date.now()) { open('drm'); return; }
    if (!state.updated) { open('update'); return; }
    if (!state.completed.maintenance) { update({ maintenanceUntil: Date.now() + 15000 }); open('maintenance'); return; }
    if (state.maintenanceUntil > Date.now()) { open('maintenance'); return; }
    if (new Date().getMinutes() % 30 === 0 && new Date().getSeconds() < 20) { update({ maintenanceUntil: Date.now() + 20000 }); open('maintenance'); return; }
    if (!state.premium && !state.completed.banner) { open('banner'); return; }
    if (!state.completed.ads) { open('ads'); return; }
    if (!state.completed['dismiss-fake']) {
      encounter('fake-dismiss');
      setState(s => ({ ...s, alarms: [...s.alarms, { id: crypto.randomUUID(), time: new Date().toTimeString().slice(0, 5), enabled: true, nextAt: nextAlarm(new Date().toTimeString().slice(0, 5)) }], completed: { ...s.completed, 'dismiss-fake': true } }));
      notify('Dismiss created a reminder for tomorrow. This alarm remains active; request dismissal again.'); return;
    }
    if (!state.paperwork) { setCaptchaFor('paperwork'); open('captcha'); return; }
    if (state.paperwork && state.paperwork.due > Date.now()) { open('paperwork'); return; }
    open('queue');
  }
  function purchase(kind: Product) {
    const data = { snooze: ['Five-minute snooze', snoozePrice(state.snoozes, state.score)], loot: ['Random snooze crate · 0–60 seconds', 299], premium: ['WakeUp Premium · first month', 2999], dlc: ['Peace & Quiet · perpetual device license', 4999], priority: ['Priority dismissal placement', 999], dismiss: ['Alarm dismissal authorization', 99] } as const;
    if ((kind === 'snooze' || kind === 'loot') && !ringing) { notify('A snooze requires an active alarm.'); return; }
    encounter('fees'); if (kind === 'snooze') encounter('pay-snooze'); if (kind === 'loot') encounter('lootbox');
    const hour = new Date().getHours(); const peak = kind === 'dismiss' && hour >= 5 && hour < 9;
    if (peak) encounter('surge'); if (kind === 'dismiss') encounter('tip');
    setCheckout({ kind, title: data[kind][0], base: data[kind][1], peak, id: `WAC-${crypto.randomUUID().slice(0, 8).toUpperCase()}` });
    setTip(0); setDecline(false); paying.current = false; setGate(null);
  }
  function pay() {
    if (!checkout || checkout.paid || paying.current) return;
    if (checkout.kind === 'dismiss' && (!online || state.lockedUntil > Date.now())) { setCheckout(null); open(!online ? 'drm' : 'rate'); return; }
    if (checkout.kind === 'dismiss' && !validGratuity(tip)) { notify('Gratuity rejected. The minimum service appreciation is 30%.'); return; }
    if (decline) { notify('PAY-402: The wallet declined this request. Select another payment method to retry.'); return; }
    paying.current = true;
    const receipt = { ...invoice(checkout.base, checkout.peak, tip), id: checkout.id, title: checkout.title, at: Date.now() };
    setState(s => ({ ...s, balance: s.balance - receipt.total, receipts: [receipt, ...s.receipts], premium: s.premium || checkout.kind === 'premium', dlc: s.dlc || checkout.kind === 'dlc', pendingSnooze: checkout.kind === 'snooze' || checkout.kind === 'loot' ? checkout.kind : s.pendingSnooze }));
    setCheckout({ ...checkout, paid: receipt }); complete(checkout.kind);
    if (checkout.kind === 'dismiss') silence();
    if (checkout.kind === 'dlc') update({ volume: 0 });
    if (checkout.kind === 'snooze' || checkout.kind === 'loot') { pendingSnooze.current = checkout.kind; paidSnooze.current = true; }
  }
  function returnFromPayment() {
    if (!checkout) return;
    const kind = checkout.kind; setCheckout(null);
    if (kind === 'dismiss') notify('Your dismissal receipt is available in Billing.');
    else if (kind === 'snooze' || kind === 'loot') open('rating');
    else if (kind === 'priority') open('queue');
    else if (kind === 'dlc') { update({ volume: 0 }); setAlarmVolume(0); notify('Peace & Quiet installed. Output muted.'); }
    else notify('Premium activated. Request dismissal to continue.');
  }
  function activateSnooze() {
    const seconds = (state.pendingSnooze || pendingSnooze.current) === 'loot' ? Math.floor(Math.random() * 61) : 300;
    update({ snoozeUntil: seconds ? Date.now() + seconds * 1000 : 0, pendingSnooze: null });
    setState(s => ({ ...s, snoozes: s.snoozes + 1, score: Math.max(0, s.score - 35), xp: s.xp + 5 }));
    encounter('credit'); encounter('debt'); paidSnooze.current = false; complete('rating'); setGate(null);
    notify(`Rating accepted. ${seconds} seconds awarded; credit score reduced by 35.`);
  }
  function snooze(kind: 'snooze' | 'loot') {
    if (!ringing) { notify('A snooze requires an active alarm.'); return; }
    pendingSnooze.current = kind;
    if (['JO', 'GB'].includes(state.region.toUpperCase())) open('region'); else purchase(kind);
  }
  function saveAlarm() {
    if (!editor || !/^\d{2}:\d{2}$/.test(editor.time)) return;
    if (state.score < 500 && editor.time > '06:00') { encounter('credit'); notify('Credit policy CR-500 restricts new wake-up times to 06:00 or earlier.'); return; }
    const saved = { ...editor, nextAt: nextAlarm(editor.time) };
    setState(s => ({ ...s, alarms: [...s.alarms.filter(a => a.id !== saved.id), saved] }));
    setEditor(null); afterForm(() => open('sync'));
  }
  function exportStatement() {
    const blob = new Blob([JSON.stringify(state.receipts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'wakeup-statement.json'; a.click(); URL.revokeObjectURL(url);
  }
  function resetSession() {
    sessionVersion.current++; paying.current = false; paidSnooze.current = false;
    resume.current = () => {}; afterSurvey.current = () => {}; pendingSnooze.current = 'snooze';
    stopAlarmSound(); setAudio(false); setDismissing(false);
    try { setState(resetState()); } catch { notify('Storage could not be cleared. Check browser storage permissions.'); return; }
    setPage('alarms'); setFast(false); setTools(false); setGate(null); setCheckout(null); setEditor(null);
    setInside(false); setLogin(0); setPassword(''); setEmail(''); setMessage(''); setInput(''); setCode('');
    setRound(0); setStep(0); setElapsed(0); setTip(0); setDecline(false); setCaptcha(null); setSelected([]);
    setCaptchaFor('accessibility'); setCaptchaOffset({ x: 0, y: 0 }); setRefusalPosition(null);
    setPrivacyY(0); setPrivacyEnd(false); setQueue(14892); setNow(Date.now());
  }
  function showFeature(id: string) {
    if (id === 'survey') { setTools(false); afterForm(() => {}); return; }
    setTools(false);
    if (['surge', 'tip', 'fees', 'battlepass', 'debt', 'credit', 'account', 'fake-dismiss', 'volume', 'lootbox', 'pay-snooze'].includes(id)) encounter(id);
    if (['pay-snooze', 'lootbox'].includes(id)) { if (!ringing) trigger(); pendingSnooze.current = id === 'lootbox' ? 'loot' : 'snooze'; open('region'); return; }
    if (['surge', 'tip', 'fees'].includes(id)) { purchase('dismiss'); if (id === 'surge') setCheckout(c => c ? { ...c, peak: true } : c); return; }
    if (id === 'battlepass') { setPage('rewards'); return; }
    if (id === 'debt' || id === 'credit') { setPage('billing'); return; }
    if (id === 'account') { setInside(false); setLogin(0); return; }
    if (id === 'fake-dismiss') { trigger(); setState(s => ({ ...s, expired: false, verifiedDay: day(), daily: day(), premium: true, updated: true, drmUntil: Date.now() + 86400000, cookies: true, completed: { ...s.completed, ads: true, 'dismiss-fake': false } })); return; }
    if (id === 'volume') { update({ volume: Math.min(100, state.volume + 10) }); notify('Negative numbers are not supported. Volume increased.'); open('sync'); return; }
    if (id === 'maintenance') update({ maintenanceUntil: Date.now() + 30000 });
    if (id === 'rate') update({ lockedUntil: Date.now() + 7 * 86400000 });
    if (id === 'rating') { trigger(); pendingSnooze.current = 'snooze'; paidSnooze.current = true; update({ pendingSnooze: 'snooze' }); open('rating'); return; }
    if (id === 'region') { if (!ringing) trigger(); pendingSnooze.current = 'snooze'; }
    open(id as Gate);
  }
  const button = (label: string, action: () => void, disabled = false, secondary = false) => <button type="button" className={`button${secondary ? ' secondary' : ''}`} disabled={disabled} onClick={action}>{label}</button>;
  const row = (label: string, description: string, control: ReactNode) => <div className="setting-row"><div><strong>{label}</strong><p>{description}</p></div>{control}</div>;
  function dialogContent() {
    switch (gate) {
      case 'startup': return <><div className="loader"><div style={{ width: `${elapsed < 8 ? Math.min(99, elapsed * 20) : 100}%` }} /></div><p>{elapsed < 5 ? 'Downloading wakefulness.exe' : elapsed < 8 ? '99% · Waiting for the last byte of initiative…' : 'Verifying downloaded consciousness · signature accepted'}</p>{button('Open workspace', () => { complete('startup'); setGate(null); }, elapsed < 10)}</>;
      case 'onboarding': return <><span className="eyebrow">LESSON {step + 1} OF 4</span><h3>{['An alarm makes a sound at a scheduled time.', 'Keep this browser open and your device awake.', 'Enable sound once after opening the application.', 'Stopping sound requires an authorized dismissal.'][step]}</h3><p>Morning certification · {day()}</p>{button(step === 3 ? 'Review today’s agreement' : 'Acknowledge lesson', () => step === 3 ? (complete('onboarding'), open('terms')) : setStep(s => s + 1))}</>;
      case 'terms': return <><span className="eyebrow">PAGE {step + 1} OF 47</span><h3>{terms[step][0]}</h3><div className="document-scroll"><p>{terms[step][1]}</p></div><div className="actions">{button(step === 46 ? 'Accept agreement' : 'Accept and next page', () => { if (step < 46) setStep(s => s + 1); else { update({ daily: day() }); complete('terms'); setGate(null); resume.current(); } })}<button ref={refusalRef} className="button secondary fleeing" tabIndex={-1} aria-disabled="true" style={refusalPosition ? { position: 'fixed', left: refusalPosition.x, top: refusalPosition.y, zIndex: 150 } : undefined} onPointerDown={e => e.preventDefault()} onClick={e => { e.preventDefault(); e.stopPropagation(); }}>I disagree</button>{fast && button('Presenter: accept all pages', () => { update({ daily: day() }); complete('terms'); setGate(null); resume.current(); })}</div></>;
      case 'privacy': return <><p>Reading speed: one pixel per second. {Math.floor(privacyY)} pixels acknowledged.</p><div className="document-scroll privacy-document" ref={privacyRef} onScroll={e => { if (Math.abs(e.currentTarget.scrollTop - privacyY) > 1) e.currentTarget.scrollTop = privacyY; }} tabIndex={0} aria-label="Privacy notice, automatically scrolling">{privacy.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div>{button('Acknowledge privacy notice', () => { complete('privacy'); setGate(null); }, !privacyEnd)}</>;
      case 'cookies': return <><p>Necessary cookies maintain alarm appointments. Optional cookies support commercial profiling and service personalization.</p><div className="detail">Purpose <strong>Sleep monetization and consent accounting</strong></div>{button('Accept all', () => { update({ cookies: true }); complete('cookies'); setGate(null); })} {button('Reject all', () => { update({ cookies: false }); complete('cookies'); setGate(null); notify('Optional cookies rejected. Silence rights revoked; revise your preferences in Settings.'); }, false, true)}</>;
      case 'drm': return <><p>WakeUp Licensing requires an active Wi-Fi connection to authorize alarm controls.</p><div className="detail">Network status <strong>{online ? 'Connected' : 'Disconnected'}</strong></div>{button('Verify connection', () => { update({ drmUntil: Date.now() + 86400000 }); complete('drm'); setGate(null); }, !online)}</>;
      case 'update': return <><div className="detail">Wakefulness Runtime 26.10 <strong>4.7 GB</strong></div><div className="loader"><div style={{ width: `${Math.min(100, elapsed * 5)}%` }} /></div><p>{elapsed < 12 ? 'Downloading required components' : elapsed < 17 ? 'Verifying local package manifest' : 'Installing dismissal compatibility fixes'} · {Math.min(100, elapsed * 5)}%</p>{button('Restart authorization service', () => { update({ updated: true }); complete('update'); setGate(null); }, elapsed < 20)}</>;
      case 'sync': return <><p>Reconciling this operation across 17 availability regions. Changes are awaiting replica confirmation.</p><div className="loader"><div style={{ width: `${Math.min(100, elapsed * 25)}%` }} /></div>{elapsed >= 4 && <p>{step ? 'SYNC-503: Replica unavailable. Your local copy is authoritative.' : 'All local changes reconciled.'}</p>}{button('Return to workspace', () => { complete('sync'); setGate(null); }, elapsed < 4)}</>;
      case 'password-expiry': return <><p>Your alarm has activated, expiring your account password. Create a replacement to restore account eligibility.</p><label className="field">Replacement password<input type="password" value={input} onChange={e => setInput(e.target.value)} autoComplete="new-password" /></label>{button('Renew password', () => { update({ expired: false }); complete('password-expiry'); afterForm(() => open('device')); }, input.length < 6)}</>;
      case 'device': return <><div className="detail">Recognized installation <strong>{state.device.slice(0, 8) || 'LOCAL'}</strong></div><p>{navigator.platform} · This is the same installation. Our policy requires a second opinion.</p>{button('Confirm this device', () => { complete('device'); open('totp'); })}</>;
      case 'totp': return <><p>Submit five consecutive valid codes. Our verification infrastructure discards the first four confirmations.</p><div className="code-preview" aria-label="Local authenticator code">{code}</div><label className="field">Authenticator code<input inputMode="numeric" value={input} maxLength={6} onChange={e => setInput(e.target.value)} /></label><p>{round} of 5 confirmed</p>{button('Verify code', () => { const version = sessionVersion.current; void totp().then(actual => { if (version !== sessionVersion.current) return; setInput(''); setCode(actual); if (input !== actual) { setRound(0); notify('Invalid or expired code. Consecutive confirmations reset.'); } else if (round === 4) { update({ verifiedDay: day() }); complete('totp'); setGate(null); notify('Device confirmed. Request dismissal to continue.'); } else { setRound(r => r + 1); notify('Code accepted. Confirmation discarded; please resubmit.'); } }); })}</>;
      case 'premium': return <><div className="subscription"><h3>WakeUp Premium</h3><strong>$29.99 / month</strong><p>Extend dismissal beyond {state.score < 500 ? '09:00–12:00' : '09:00–17:00'}. Advertising and statutory approvals remain applicable.</p></div>{button('Purchase Premium', () => purchase('premium'))}<p>Or return during your free dismissal hours.</p></>;
      case 'banner': return <><p>The free dismissal control is below this sponsored placement.</p><div className="occluded"><button className="button" disabled>Dismiss alarm</button><button className="occluder" onClick={() => { complete('banner'); open('ads'); }}>WakeUp Premium · reclaim this space →</button></div></>;
      case 'ads': return <><div className="sponsored ad-creative"><span>WAKEUP BUSINESS PLATINUM · SPONSORED</span><AlarmClock size={64} /><h3>Own your morning.</h3><p>Lease the silence.</p><strong>$29.99 <small>/ month</small></strong><div className="loader"><div style={{ width: `${Math.min(100, elapsed / 30 * 100)}%` }} /></div></div><p>Advertisement · {Math.max(0, 30 - elapsed)} seconds remaining</p>{button('Continue', () => { complete('ads'); setGate(null); }, elapsed < 30)}</>;
      case 'queue': return <><div className="queue-number">{queue.toLocaleString()}</div><p>requests ahead of yours. Your position updates automatically.</p>{button('Buy priority placement', () => purchase('priority'), !!state.completed.priority)} {button('Continue to dismissal checkout', () => purchase('dismiss'), queue > 0)}<p>Need statutory clearance instead? {button('Apply for WAKE-1040', () => { setCaptchaFor('paperwork'); open('captcha'); }, false, true)}</p></>;
      case 'maintenance': return <><p>WAC-MNT-902 · Dismissal Authorization Service is undergoing scheduled maintenance. Essential alarm playback continues.</p><div className="detail">Next service window <strong>{new Date(state.maintenanceUntil).toLocaleTimeString()}</strong></div>{button('Retry authorization', () => { complete('maintenance'); update({ maintenanceUntil: 0 }); setGate(null); }, now < state.maintenanceUntil && !fast)}</>;
      case 'rate': return <><div className="error-code">429</div><p>Six requests exceeded your dismissal allowance. Access resumes {new Date(state.lockedUntil).toLocaleString()}. Billing and other workspace functions remain available.</p></>;
      case 'region': return <><div className="detail">Licensed region <strong>{state.region}</strong></div><p>REG-451: Standard snoozing is restricted in JO and GB under the Regional Wakefulness Distribution Schedule. An exception may be issued for this transaction.</p>{button('Purchase one-time snooze exception', () => purchase(pendingSnooze.current))}</>;
      case 'rating': return <><p>Your purchased snooze is pending. Complete your review before the countdown begins.</p><div className="actions">{[1, 2, 3, 4, 5].map(n => <button className="button secondary" key={n} onClick={() => n === 5 ? activateSnooze() : notify('Ratings below five stars are currently incompatible with our business model.')}>{n} ★</button>)}</div></>;
      case 'dlc': return <><p>Mute is licensed separately from dismissal. This purchase permanently unlocks the mute control in this browser.</p><div className="subscription"><h3>Peace & Quiet</h3><strong>$49.99 / device</strong></div>{button('Buy expansion', () => purchase('dlc'))}</>;
      case 'accessibility': return <><p>Accessibility requests require verification. Our identity service protects all human requests.</p>{button('Begin verification', () => { setCaptchaFor('accessibility'); open('captcha'); })}</>;
      case 'captcha': return captcha && <><p>{captcha.prompt}</p><div className="captcha-grid" style={{ transform: `translate(${captchaOffset.x}px, ${captchaOffset.y}px)` }}>{captcha.tiles.map((tile, i) => <button type="button" key={i} aria-label={`Tile ${i + 1}: ${tile}`} aria-pressed={selected.includes(i)} className={selected.includes(i) ? 'chosen' : ''} onClick={() => setSelected(s => s.includes(i) ? s.filter(v => v !== i) : [...s, i])}>{tile}</button>)}</div><p>{round} of 3 rounds confirmed</p>{button('Verify selection', () => { const valid = selected.length === captcha.correct.length && selected.every(v => captcha.correct.includes(v)); setCaptcha(makeCaptcha()); setSelected([]); if (!valid) { setRound(0); notify('Selection rejected. A fresh challenge has been issued.'); } else if (round < 2) { setRound(r => r + 1); notify('Human status provisionally acknowledged. Continue verification.'); } else { complete('captcha'); if (captchaFor === 'accessibility') { update({ accessibility: true }); complete('accessibility'); setGate(null); } else open('paperwork'); } })}</>;
      case 'survey': return <><p>Before we finish processing your form, rate the efficiency of this interaction.</p><label className="field">Service rating<select aria-label="Service rating" value={input} onChange={e => setInput(e.target.value)}><option value="">Select a rating</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} / 5</option>)}</select></label>{button('Submit required feedback', () => { update({ pendingSurvey: false }); complete('survey'); setGate(null); const next = afterSurvey.current; afterSurvey.current = () => {}; next(); }, !input)}</>;
      case 'paperwork': return state.paperwork ? <><p>Application {state.paperwork.reference} has been received.</p><div className="detail">Expected determination <strong>{new Date(state.paperwork.due).toLocaleDateString()}</strong></div>{button('Use approved determination', () => { setDismissing(true); setGate(null); }, now < state.paperwork.due)}{fast && button('Presenter: approve now', () => update({ paperwork: { ...state.paperwork!, due: Date.now() } }))}</> : <form onSubmit={e => { e.preventDefault(); if (!validApplication(input)) { notify('Your statement must contain exactly 500 words.'); return; } update({ paperwork: { reference: `WAKE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, due: businessDue(3 + Math.floor(Math.random() * 3)) } }); complete('paperwork'); afterForm(() => open('paperwork')); }}><span className="eyebrow">FORM WAKE-1040 · AUDIBLE TERMINATION REQUEST</span><label className="field">Applicant name<input required defaultValue="Jordan Miller" /></label><label className="field">Statement of necessity<textarea required value={input} onChange={e => setInput(e.target.value)} /></label><p aria-live="polite">{wordCount(input)} / 500 words · exactly 500 required</p><label className="consent"><input type="checkbox" required /> I declare that I intend to stop this alarm.</label><p>Processing takes 3–5 business days, excluding weekends. Submit a statement of exactly 500 words.</p><button className="button" type="submit" disabled={!validApplication(input)}>Submit application</button></form>;
      case 'cancel': { const hour = new Date().getHours(); const available = hour >= 22 || hour < 6 || fast; return <><p>Customer retention accepts cancellation calls during your sleeping hours: 22:00–06:00 local time. Calls are monitored for retention compliance.</p><div className="detail">Agent status <strong>{available ? 'Accepting sleepy callers' : 'Closed until 22:00'}</strong></div>{step === 0 ? button('Connect to retention agent', () => setStep(1), !available || !state.premium) : step === 1 ? <><p>Agent: Before I cancel, explain why wakefulness no longer meets your needs.</p><label className="field">Cancellation reason<textarea value={input} onChange={e => setInput(e.target.value)} /></label>{button('Submit reason', () => afterForm(() => { open('cancel'); setStep(2); }), input.trim().length < 5)}</> : <><p>Agent: We can offer the same plan at the same price. Would you reconsider?</p>{button('Decline offer and cancel', () => { update({ premium: false }); complete('cancel'); setGate(null); notify('Premium canceled. Office-hours dismissal restored.'); })} {button('Keep Premium', () => setGate(null), false, true)}</>}</>; }
      case 'reset': return <><p>Your recovery link is available below.</p><div className="reset-url">/reset?token=RECOVERY-PENDING</div>{button('Open reset link', () => notify(inside ? 'Recovery authorized for Jordan Miller. Your account is restored.' : '401: Sign in before resetting the password you need to sign in.'))}</>;
      default: return null;
    }
  }

  if (!ready) return <div className="loading">Connecting to WakeUp Enterprise…</div>;
  if (!online) return <main className="connection-error" role="alert"><div><CircleHelp size={42} /><h1>This site can’t be reached</h1><p><strong>WakeUp Enterprise</strong> could not establish a connection to the licensing service.</p><p>Check your Wi-Fi connection and try again.</p><code>ERR_INTERNET_DISCONNECTED</code><div className="actions">{button('Retry connection', () => void networkRetry.current())}{button('Reset workspace', resetSession, false, true)}</div></div></main>;
  const modal = gate && <div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-label={titles[gate]}><header className="dialog-header"><div><span className="eyebrow">WAKEUP ENTERPRISE · ACCOUNT SERVICES</span><h2>{titles[gate]}</h2></div>{!(gate === 'survey' || (gate === 'rating' && (paidSnooze.current || state.pendingSnooze))) && <button className="icon-button" aria-label="Close dialog" onClick={close}><X size={18} /></button>}</header><div className="dialog-content">{dialogContent()}</div><footer className="dialog-footer"><span>WakeUp Service Assurance</span>{!(gate === 'rating' && (paidSnooze.current || state.pendingSnooze)) && <button className="text-button" onClick={close}>Return</button>}</footer></section></div>;
  const notice = message && <div className="notice" role="status"><span>{message}</span><button aria-label="Dismiss notification" onClick={() => setMessage('')}><X size={16} /></button></div>;
  if (!inside) return <div className="auth-shell"><header className="auth-header"><div className="wordmark"><span className="mark"><AlarmClock size={20} /></span>WakeUp <span className="wordmark-light">Enterprise</span></div><span className="auth-system">Identity services</span></header><main className="auth-main"><section className="auth-card"><span className="eyebrow">WAKEUP IDENTITY SERVICES</span><h1>{['Create your account', 'Sign in to WakeUp', 'Create your account again', 'Account located'][login]}</h1>{login === 3 ? <><p>Your password belongs to jordan.miller@wakeup.example, an existing account. We have assigned it to you.</p>{button('Go to workspace', () => { setInside(true); setPassword(''); encounter('account'); if (state.pendingSurvey) { open('survey'); } else if (state.pendingSnooze) { pendingSnooze.current = state.pendingSnooze; paidSnooze.current = true; open('rating'); } else if (!state.completed.startup) open('startup'); })}</> : <form onSubmit={e => { e.preventDefault(); setLogin(n => n + 1); encounter('account'); notify(['An account already exists with that email. Sign in instead.', 'No account exists with that email. Register again.', 'That password belongs to Jordan Miller. We located your account.'][login]); afterForm(() => {}); }}><p className="muted">Manage your schedule and continued eligibility for sleep.</p><label className="field">Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" /></label><label className="field">Password<input type="password" required minLength={3} value={password} onChange={e => setPassword(e.target.value)} /></label><button type="submit" className="button full">{login === 1 ? 'Sign in' : 'Continue'}</button><div className="auth-switch"><button type="button" onClick={() => open('reset')}>Forgot password?</button></div></form>}</section><p className="auth-legal">WakeUp Enterprise · Keep the browser open and device awake for alarms.</p></main>{modal}{notice}</div>;

  return <div className={`shell${state.accessibility ? ' accessible' : ''}`}><aside className="sidebar"><div className="brand"><span className="mark"><AlarmClock size={19} /></span><div>WakeUp <small>ENTERPRISE</small></div></div><div className="sidebar-heading">WORKSPACE</div><nav>{nav.map(item => <button key={item.key} className={`nav-link ${page === item.key ? 'is-active' : ''}`} onClick={() => { setPage(item.key); setMessage(''); if (item.key === 'rewards') encounter('battlepass'); if (item.key === 'billing') { encounter('debt'); encounter('credit'); } }}><item.icon size={17} />{item.label}</button>)}</nav><div className="sidebar-end"><div className="profile"><span className="avatar">JM</span><div><strong>Jordan Miller</strong><small>{state.premium ? 'Premium' : 'Free'} workspace</small></div></div><button className="signout" onClick={() => { setInside(false); setLogin(0); setGate(null); setCheckout(null); setEditor(null); }}><LogOut size={15} />Sign out</button></div></aside><main className="workspace"><header className="topbar"><span>Workspace / {nav.find(p => p.key === page)?.label}</span><span className="pill">WakeUp Enterprise</span></header><div className="content"><div className="heading"><div><span className="eyebrow">WORKSPACE SERVICES</span><h1>{nav.find(p => p.key === page)?.label}</h1><p className="muted">{page === 'alarms' ? 'Manage your wake-up schedule and associated services.' : 'WakeUp Enterprise · Device account'}</p></div>{page === 'alarms' && button('New alarm', () => { void enableAudio(); dailyThen(() => setEditor({ id: crypto.randomUUID(), time: '06:00', enabled: true, nextAt: 0 })); })}</div>
    {page === 'alarms' && <>
      {state.activeId && <div className="ring-banner"><div><span>{ringing ? 'ACTIVE ALARM' : 'SNOOZE ACTIVE'}</span><h2>{ringing ? 'Your alarm is ringing' : `${Math.max(0, Math.ceil((state.snoozeUntil - now) / 1000))} seconds remaining`}</h2><p>Sleep debt continues to accrue.</p></div>{ringing && <div className="actions">{button('Dismiss', dismiss)}{button('Snooze', () => snooze('snooze'), false, true)}</div>}</div>}
      {!audio && <div className="section-card slim"><p>Enable sound after opening this browser. Keep the browser open and your device awake.</p>{button('Enable sound', () => void enableAudio())}</div>}
      <section className="section-card"><div className="section-header"><h2>Scheduled alarms</h2><span>{state.alarms.length} alarms</span></div>{state.alarms.length ? state.alarms.map(a => <div className="alarm-row" key={a.id}><AlarmClock size={24} /><div className="alarm-description"><strong>{a.time}</strong><span>{a.enabled ? `Next: ${new Date(a.nextAt).toLocaleString()}` : 'Disabled'}</span></div><div className="actions">{button(a.enabled ? 'Disable' : 'Enable', () => { void enableAudio(); setState(s => ({ ...s, alarms: s.alarms.map(v => v.id === a.id ? { ...v, enabled: !v.enabled, nextAt: nextAlarm(v.time) } : v) })); }, false, true)}{button('Edit', () => setEditor({ ...a }), false, true)}{button('Delete', () => { setState(s => ({ ...s, alarms: s.alarms.filter(v => v.id !== a.id) })); }, a.id === state.activeId, true)}</div></div>) : <div className="empty"><Bell size={30} /><h3>No alarms scheduled</h3><p>Create an alarm to activate wakefulness services.</p></div>}</section>
      <div className="summary-row"><div className="metric"><span>Sleep credit score</span><strong>{state.score}<small> / 850</small></strong><p>{state.score < 500 ? 'Scheduling restricted to 06:00 or earlier' : 'Snoozing reduces your allowance'}</p></div><div className="metric"><span>Sleep Debt</span><strong>{money(Math.round(state.debt))}</strong><p>1¢ / minute plus 29.99% APR</p></div><div className="metric"><span>Account balance</span><strong>{money(state.balance)}</strong><p>Overdraft permitted by corporate policy</p></div></div>
      <section className="section-card slim"><div><h2>Sound and notifications</h2><p>{audio ? 'Audio enabled for this browser session' : 'Audio needs permission'}</p></div><div className="volume-controls"><button className="icon-button" aria-label="Lower volume" onClick={() => { encounter('volume'); update({ volume: Math.min(100, state.volume + 10) }); notify('Negative numbers are not supported. Volume increased.'); open('sync'); setStep(Math.random() < .25 ? 1 : 0); }}><Volume2 size={18} /></button><input aria-label="Volume" type="range" value={state.volume} onChange={e => { update({ volume: +e.target.value }); encounter('sync'); }} onPointerUp={() => { open('sync'); setStep(Math.random() < .25 ? 1 : 0); }} onKeyUp={e => { if (e.key.startsWith('Arrow')) open('sync'); }} /><span>{state.volume}%</span><button className="icon-button" aria-label="Mute" onClick={() => state.dlc ? (update({ volume: 0 }), setAlarmVolume(0)) : open('dlc')}><VolumeX size={18} /></button></div></section>
    </>}
    {page === 'billing' && <><div className="billing-grid"><section className="section-card"><h2>Current plan</h2><div className="plan-price">{state.premium ? '$29.99' : '$0'}<small> / month</small></div><p>{state.premium ? 'Premium dismissal hours active.' : 'Free dismissal: 09:00–17:00; low credit ends at noon.'}</p>{button(state.premium ? 'Cancel subscription' : 'Upgrade to Premium', () => state.premium ? open('cancel') : purchase('premium'))}</section><section className="section-card"><h2>Sleep Debt statement</h2><div className="plan-price">{money(Math.round(state.debt))}</div><p>1¢ principal per sleeping minute. Interest compounds by minute at 29.99% nominal APR.</p><p>Credit score: {state.score} / 850. {state.score < 500 ? '50%' : state.score < 600 ? '25%' : '0%'} snooze credit adjustment.</p><p>Current snooze base: {money(snoozePrice(state.snoozes, state.score))}.</p></section></div><section className="section-card"><div className="section-header"><h2>Invoices</h2>{button('Download statement', exportStatement, false, true)}</div>{state.receipts.length ? state.receipts.map(r => <details key={r.id} className="receipt"><summary>{r.title} · {money(r.total)} · {r.id}</summary><p>{new Date(r.at).toLocaleString()}</p><div className="invoice-list">{r.lines.map(l => <div key={l.label}><span>{l.label}</span><strong>{money(l.cents)}</strong></div>)}<div className="invoice-total"><span>Total</span><strong>{money(r.total)}</strong></div></div></details>) : <p>No transactions recorded.</p>}</section></>}
    {page === 'rewards' && <><section className="section-card"><div className="rewards-top"><span>ALARM BATTLE PASS · SEASON 01</span><strong>Level {level}</strong></div><h2>Progress toward a better morning</h2><div className="loader"><div style={{ width: `${state.xp % 100}%` }} /></div><p>{state.xp} XP · Dismissal +25 XP · Snooze +5 XP</p>{button(state.rewardDay === day() ? 'Daily reward claimed' : 'Claim daily reward (+5 XP)', () => update({ xp: state.xp + 5, rewardDay: day() }), state.rewardDay === day())}{row('Alarm sounds', 'Alternative sounds unlock at level 30.', level >= 30 ? <select aria-label="Alarm sound" value={state.sound} onChange={e => update({ sound: e.target.value as SavedState['sound'] })}><option value="standard">Standard pulse</option><option value="chime">Corporate chime</option></select> : <span>Level 30 required</span>)}{[1, 10, 20, 30].map(n => <div className="detail" key={n}><span>Level {n}</span><strong>{n === 30 ? 'Sound customization' : n === 20 ? 'Senior Sleeper designation' : n === 10 ? 'Sleep Associate designation' : 'Standard pulse'} · {level >= n ? 'Unlocked' : 'Locked'}</strong></div>)}</section><section className="section-card">{row('Random snooze crate', 'An equal chance of 0 through 60 seconds.', button('Buy crate · $2.99', () => snooze('loot'), !ringing))}</section></>}
    {page === 'settings' && <section className="section-card"><h2>Device and account</h2>{row('Account recovery', 'Request account recovery.', button('Recover account', () => open('reset'), false, true))}{row('Regional licensing', `Current region: ${state.region}. JO and GB require snooze exceptions.`, <span>Regional service policy</span>)}{row('Cookie preferences', state.cookies === false ? 'Optional consent rejected; silence rights revoked.' : 'Manage consent preferences.', button('Configure cookies', () => open('cookies'), false, true))}{row('Privacy notice', 'Corporate review advances at one pixel per second.', button('Read privacy policy', () => open('privacy'), false, true))}{row('Accessibility', state.accessibility ? 'Larger controls and higher contrast enabled.' : 'Visual verification required.', button(state.accessibility ? 'Disable' : 'Enable', () => state.accessibility ? update({ accessibility: false }) : open('accessibility'), false, true))}<p className="muted">Presenter tools: Ctrl+Shift+D {button('Open presenter panel', () => setTools(true), false, true)}</p></section>}
    {page === 'support' && <section className="section-card"><h2>Customer support</h2>{row('Subscription cancellation', 'Interactive retention assistance during sleeping hours.', button('Call support', () => open('cancel'), !state.premium, true))}{row('Dismissal paperwork', 'Form WAKE-1040 · 3–5 business days.', button('Start application', () => { setCaptchaFor('paperwork'); open('captcha'); }, !ringing, true))}{row('Service status', state.maintenanceUntil > now ? 'Scheduled maintenance in progress.' : 'Authorization service available.', button('View maintenance', () => open('maintenance'), false, true))}{state.paperwork && <p>Application {state.paperwork.reference} · expected {new Date(state.paperwork.due).toLocaleDateString()}</p>}</section>}
  </div></main>{notice}{modal}
  {editor && <div className="overlay"><form className="dialog small" role="dialog" aria-modal="true" aria-label="Alarm settings" onSubmit={e => { e.preventDefault(); saveAlarm(); }}><header className="dialog-header"><h2>Alarm settings</h2><button type="button" className="icon-button" aria-label="Close editor" onClick={() => setEditor(null)}><X size={18} /></button></header><div className="dialog-content"><label className="field">Alarm time<input type="time" required value={editor.time} onChange={e => setEditor({ ...editor, time: e.target.value })} /></label><p>Repeats daily in device time. A refresh catches up missed appointments while the browser is running.</p></div><footer className="dialog-footer"><button className="button" type="submit">Save alarm</button>{button('Cancel', () => setEditor(null), false, true)}</footer></form></div>}
  {checkout && <div className="overlay payment-layer"><section className="dialog checkout-dialog" role="dialog" aria-modal="true" aria-label="WakeUp checkout"><header className="dialog-header"><div><span className="eyebrow">WAKEUP PAYMENTS · SECURE CHECKOUT</span><h2>{checkout.paid ? 'Payment receipt' : 'Review and pay'}</h2></div>{!checkout.paid && <button className="icon-button" aria-label="Close checkout" onClick={() => setCheckout(null)}><X size={18} /></button>}</header><div className="dialog-content"><div className="checkout-order"><span>Order {checkout.id}</span><strong>{checkout.title}</strong><small>WakeUp Wallet · instant account settlement</small></div>{checkout.kind === 'dismiss' && !checkout.paid && <fieldset><legend>Tip your alarm</legend><div className="actions">{[0, 20, 25, 30].map(n => <button type="button" key={n} className={`button ${tip === n ? '' : 'secondary'}`} aria-pressed={tip === n} onClick={() => setTip(n)}>{n ? `${n}%` : 'No tip'}</button>)}</div></fieldset>}<div className="invoice-list">{(checkout.paid || invoice(checkout.base, checkout.peak, tip)).lines.map(l => <div key={l.label}><span>{l.label}</span><strong>{money(l.cents)}</strong></div>)}<div className="invoice-total"><span>Total</span><strong>{money((checkout.paid || invoice(checkout.base, checkout.peak, tip)).total)}</strong></div></div>{checkout.paid ? <><p>Approved · receipt saved in Billing.</p>{button('Complete purchase', returnFromPayment)}</> : <><label className="field">Payment method<select value={decline ? 'decline' : 'approve'} onChange={e => setDecline(e.target.value === 'decline')}><option value="approve">WakeUp Wallet</option><option value="decline">WakeUp Reserve · unavailable</option></select></label><p>Charges are deducted from your WakeUp account balance. Overdraft terms apply.</p>{button(`Pay ${money(invoice(checkout.base, checkout.peak, tip).total)}`, pay)}</>}</div></section></div>}
  {tools && <div className="overlay developer-layer"><section className="dialog developer-dialog" role="dialog" aria-modal="true" aria-label="Presenter controls"><header className="dialog-header"><h2>Presenter controls</h2>{button('Close', () => setTools(false), false, true)}</header><div className="dialog-content"><div className="actions">{button('Trigger alarm now', () => { trigger(); setTools(false); })}{button('Stop / clear lockout', () => { update({ activeId: null, snoozeUntil: 0, pendingSnooze: null, lockedUntil: 0, attempts: 0 }); setGate(null); stopAlarmSound(); })}{button('Reset workspace', () => { resetSession(); setTools(false); })}{button('Reset discovery', () => update({ encounters: {}, completed: {} }))}{button('Reset finances', () => update({ balance: 2500, debt: 0, receipts: [], snoozes: 0, premium: false, dlc: false }))}</div><label className="consent"><input type="checkbox" checked={fast} onChange={e => setFast(e.target.checked)} /> Accelerate timers and support hours</label><label className="consent"><input type="checkbox" checked={state.premium} onChange={e => update({ premium: e.target.checked })} /> Premium entitlement</label><label className="field">Credit score<input type="number" min={0} max={850} value={state.score} onChange={e => update({ score: Math.max(0, Math.min(850, +e.target.value)) })} /></label><label className="field">Experience points<input type="number" min={0} value={state.xp} onChange={e => update({ xp: Math.max(0, +e.target.value) })} /></label><label className="field">Region override<select value={state.region} onChange={e => update({ region: e.target.value })}><option value={state.region}>{state.region}</option>{['JO', 'GB', 'US', 'DE'].filter(r => r !== state.region).map(r => <option key={r}>{r}</option>)}</select></label><p>{features.filter(f => state.encounters[f.id]).length} of 37 features encountered · form-completion surveys enabled</p><div className="feature-tools">{features.map(f => <button className="button secondary" key={f.id} onClick={() => showFeature(f.id)}>{state.encounters[f.id] ? '✓ ' : ''}{f.title}</button>)}</div><details><summary>Inspect session state</summary><pre>{JSON.stringify(state, null, 2)}</pre></details></div></section></div>}
  </div>;
}

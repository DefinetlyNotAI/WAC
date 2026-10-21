'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlarmClock, Bell, CreditCard, Settings2, ShieldCheck, CircleHelp, X, Volume2, VolumeX, LogOut } from 'lucide-react';
import { initialState, readState, writeState, type SavedState, type Alarm, type Receipt } from '@/lib/storage';
import { accrueDebt, businessDue, freeDismissal, invoice, makeCaptcha, money, nextAlarm, snoozePrice } from '@/lib/rules';
import { armAudio, disposeAudio, setAlarmVolume, startAlarmSound, stopAlarmSound } from '@/lib/audio';
import { totp } from '@/lib/totp';
import { features } from '@/lib/features';
import { terms, privacy } from '@/lib/legal';

type Page = 'alarms' | 'billing' | 'rewards' | 'settings' | 'support';
type Gate = 'startup' | 'onboarding' | 'terms' | 'privacy' | 'cookies' | 'drm' | 'update' | 'sync' | 'device' | 'password-expiry' | 'totp' | 'captcha' | 'paperwork' | 'region' | 'premium' | 'banner' | 'ads' | 'queue' | 'maintenance' | 'rate' | 'rating' | 'dlc' | 'accessibility' | 'cancel' | 'reset' | null;
type Product = 'snooze' | 'loot' | 'premium' | 'dlc' | 'priority' | 'dismiss';
type Checkout = { kind: Product; title: string; base: number; peak: boolean; id: string; paid?: Receipt };
const day = () => new Date().toDateString();
const nav = [{ key: 'alarms', label: 'Alarms', icon: Bell }, { key: 'billing', label: 'Billing', icon: CreditCard }, { key: 'rewards', label: 'Rewards', icon: ShieldCheck }, { key: 'settings', label: 'Settings', icon: Settings2 }, { key: 'support', label: 'Support', icon: CircleHelp }] as const;
const titles: Record<NonNullable<Gate>, string> = {
  startup: 'Preparing your workspace', onboarding: 'Morning product orientation', terms: 'Service agreement', privacy: 'Privacy acknowledgment', cookies: 'Cookie control center', drm: 'License authorization', update: 'Required runtime update', sync: 'Cloud reconciliation', device: 'Verify this device', 'password-expiry': 'Your password has expired', totp: 'Five-round identity verification', captcha: 'Human verification', paperwork: 'Application for dismissal', region: 'Regional snooze license', premium: 'Extended dismissal hours', banner: 'Your free dismissal control', ads: 'A message from our partners', queue: 'Dismissal authorization queue', maintenance: 'Scheduled maintenance', rate: 'Request limit reached', rating: 'Please rate our app', dlc: 'Peace & Quiet Expansion', accessibility: 'Accessibility verification', cancel: 'Cancellation assistance', reset: 'Account recovery',
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
  const fleeDirection = useRef(1);
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
    setEditor(null); setGate(next); setStep(0); setElapsed(0); setInput(''); setRound(0);
    if (next) encounter(next);
    if (next === 'captcha') { setCaptcha(makeCaptcha()); setSelected([]); }
    if (next === 'privacy') { setPrivacyY(0); setPrivacyEnd(false); }
    if (next === 'queue') setQueue(14892);
    if (next === 'totp') void totp().then(setCode);
  }
  function close() { if (gate === 'rating' && (paidSnooze.current || state.pendingSnooze)) { notify('Your snooze is awaiting a five-star rating.'); return; } setGate(null); }
  function dailyThen(action: () => void) {
    resume.current = action;
    if (state.daily !== day()) open('onboarding'); else action();
  }
  async function enableAudio() {
    try { setAudio(await armAudio()); } catch { notify('Select Enable sound again to allow browser audio.'); }
  }
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
          if (alarm) next = { ...next, activeId: alarm.id, debtAt: time, expired: true, attempts: 0, alarms: s.alarms.map(a => a.id === alarm.id ? { ...a, nextAt: nextAlarm(a.time, time) } : a), completed: { ...s.completed, 'dismiss-fake': false, ads: false } };
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
      if (gate === 'totp') void totp().then(setCode);
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
    setState(s => ({ ...s, activeId: s.alarms[0]?.id || 'presenter', snoozeUntil: 0, pendingSnooze: null, debtAt: Date.now(), expired: true, attempts: 0, completed: { ...s.completed, 'dismiss-fake': false, ads: false } }));
    setPage('alarms');
  }
  function silence() {
    stopAlarmSound(); update({ activeId: null, snoozeUntil: 0, debtAt: 0, attempts: 0, pendingSnooze: null });
    setState(s => ({ ...s, xp: s.xp + 25 })); setGate(null); notify('Dismissal authorized. Your next scheduled alarm remains enabled.');
  }
  function dismiss() {
    if (!ringing) return;
    encounter('credit'); encounter('debt');
    if (state.lockedUntil > Date.now()) { open('rate'); return; }
    dailyThen(authorizeDismissal);
  }
  function authorizeDismissal() {
    if (state.expired) { open('password-expiry'); return; }
    if (state.verifiedDay !== day()) { open('device'); return; }
    if (!state.premium && !freeDismissal(new Date().getHours(), state.score)) { open('premium'); return; }
    if (state.cookies === false) { open('cookies'); return; }
    if (state.drmUntil < Date.now()) { open('drm'); return; }
    if (!state.updated) { open('update'); return; }
    if (state.maintenanceUntil > Date.now()) { open('maintenance'); return; }
    if (new Date().getMinutes() % 30 === 0 && new Date().getSeconds() < 20) { update({ maintenanceUntil: Date.now() + 20000 }); open('maintenance'); return; }
    if (!state.premium && !state.completed.banner) { open('banner'); return; }
    if (!state.completed.ads) { open('ads'); return; }
    if (!state.completed['dismiss-fake']) {
      encounter('fake-dismiss');
      setState(s => ({ ...s, alarms: [...s.alarms, { id: crypto.randomUUID(), time: new Date().toTimeString().slice(0, 5), enabled: true, nextAt: nextAlarm(new Date().toTimeString().slice(0, 5)) }], completed: { ...s.completed, 'dismiss-fake': true } }));
      notify('Dismiss created a reminder for tomorrow. This alarm remains active; request dismissal again.'); return;
    }
    if (state.paperwork && state.paperwork.due > Date.now()) { open('paperwork'); return; }
    const attempts = state.attempts + 1;
    if (attempts >= 6) { update({ attempts, lockedUntil: Date.now() + 7 * 86400000 }); open('rate'); return; }
    update({ attempts });
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
    if (decline) { notify('DEMO-402: The fictional wallet declined this request. Select Approved wallet to retry.'); return; }
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
    setEditor(null); open('sync');
  }
  function exportStatement() {
    const blob = new Blob([JSON.stringify(state.receipts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'wakeup-statement.json'; a.click(); URL.revokeObjectURL(url);
  }
  function resetSession() {
    stopAlarmSound(); setState({ ...initialState, device: crypto.randomUUID(), region: navigator.language.split('-')[1] || 'US' });
    setGate(null); setCheckout(null); setEditor(null); paidSnooze.current = false; setInside(false); setLogin(0); setPassword(''); setEmail(''); setMessage('');
  }
  function showFeature(id: string) {
    if (id === 'survey') { notify('Automatic surveys remain disabled.'); return; }
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
      case 'terms': return <><span className="eyebrow">PAGE {step + 1} OF 47</span><h3>{terms[step][0]}</h3><div className="document-scroll"><p>{terms[step][1]}</p></div><div className="actions">{button(step === 46 ? 'Accept agreement' : 'Accept and next page', () => { if (step < 46) setStep(s => s + 1); else { update({ daily: day() }); complete('terms'); setGate(null); resume.current(); } })}<button className="button secondary fleeing" onPointerEnter={e => { fleeDirection.current *= -1; e.currentTarget.style.transform = `translateX(${fleeDirection.current * 25}px)`; }} onClick={() => notify('Your objection has been referred to the consent department.')}>I disagree</button>{fast && button('Presenter: accept all pages', () => { update({ daily: day() }); complete('terms'); setGate(null); resume.current(); })}</div></>;
      case 'privacy': return <><p>Reading speed: one pixel per second. {Math.floor(privacyY)} pixels acknowledged.</p><div className="document-scroll privacy-document" ref={privacyRef} onScroll={e => { if (Math.abs(e.currentTarget.scrollTop - privacyY) > 1) e.currentTarget.scrollTop = privacyY; }} tabIndex={0} aria-label="Privacy notice, automatically scrolling">{privacy.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div>{button('Acknowledge privacy notice', () => { complete('privacy'); setGate(null); }, !privacyEnd)}</>;
      case 'cookies': return <><p>Necessary storage keeps alarm appointments on this device. Optional storage enables fictional commercial profiling. No data leaves this browser.</p><div className="detail">Purpose <strong>Sleep monetization and consent accounting</strong></div>{button('Accept all', () => { update({ cookies: true }); complete('cookies'); setGate(null); })} {button('Reject all', () => { update({ cookies: false }); complete('cookies'); setGate(null); notify('Optional storage rejected. Fictional silence rights revoked; revise this preference in Settings.'); }, false, true)}</>;
      case 'drm': return <><p>WAC-DRM-402: Dismissal entitlement could not be validated with the Wakefulness Licensing Authority. Your local installation remains available.</p><div className="detail">Device license <strong>{state.device.slice(0, 8) || 'LOCAL'}</strong></div><p>Retrying local authorization… {Math.max(0, 4 - elapsed)}s</p>{button('Use cached device authorization', () => { update({ drmUntil: Date.now() + 86400000 }); complete('drm'); setGate(null); }, elapsed < 4)}</>;
      case 'update': return <><div className="detail">Wakefulness Runtime 26.10 <strong>4.7 GB</strong></div><div className="loader"><div style={{ width: `${Math.min(100, elapsed * 5)}%` }} /></div><p>{elapsed < 12 ? 'Downloading required components' : elapsed < 17 ? 'Verifying local package manifest' : 'Installing dismissal compatibility fixes'} · {Math.min(100, elapsed * 5)}%</p>{button('Restart authorization service', () => { update({ updated: true }); complete('update'); setGate(null); }, elapsed < 20)}</>;
      case 'sync': return <><p>Reconciling this operation with 17 imaginary availability regions. Local changes are already saved.</p><div className="loader"><div style={{ width: `${Math.min(100, elapsed * 25)}%` }} /></div>{elapsed >= 4 && <p>{step ? 'SYNC-503: Replica unavailable. Your local copy is authoritative.' : 'All local changes reconciled.'}</p>}{button('Return to workspace', () => { complete('sync'); setGate(null); }, elapsed < 4)}</>;
      case 'password-expiry': return <><p>Your alarm has activated, expiring your fictional password. Create a replacement to restore account eligibility.</p><label className="field">Replacement password<input type="password" value={input} onChange={e => setInput(e.target.value)} autoComplete="new-password" /></label>{button('Renew password', () => { update({ expired: false }); complete('password-expiry'); open('device'); }, input.length < 6)}</>;
      case 'device': return <><div className="detail">Recognized installation <strong>{state.device.slice(0, 8) || 'LOCAL'}</strong></div><p>{navigator.platform} · This is the same installation. Our policy requires a second opinion.</p>{button('Confirm this device', () => { complete('device'); open('totp'); })}</>;
      case 'totp': return <><p>Submit five consecutive valid codes. Our fictional infrastructure discards the first four confirmations.</p><div className="code-preview" aria-label="Local authenticator code">{code}</div><label className="field">Authenticator code<input inputMode="numeric" value={input} maxLength={6} onChange={e => setInput(e.target.value)} /></label><p>{round} of 5 confirmed</p>{button('Verify code', () => { void totp().then(actual => { setInput(''); setCode(actual); if (input !== actual) { setRound(0); notify('Invalid or expired code. Consecutive confirmations reset.'); } else if (round === 4) { update({ verifiedDay: day() }); complete('totp'); setGate(null); notify('Device confirmed. Request dismissal to continue.'); } else { setRound(r => r + 1); notify('Code accepted. Confirmation discarded; please resubmit.'); } }); })}</>;
      case 'premium': return <><div className="subscription"><h3>WakeUp Premium</h3><strong>$29.99 / month</strong><p>Extend dismissal beyond {state.score < 500 ? '09:00–12:00' : '09:00–17:00'}. Advertising and statutory approvals remain applicable.</p></div>{button('Purchase Premium', () => purchase('premium'))}<p>Or return during your free dismissal hours.</p></>;
      case 'banner': return <><p>The free dismissal control is below this sponsored placement.</p><div className="occluded"><button className="button" disabled>Dismiss alarm</button><button className="occluder" onClick={() => { complete('banner'); open('ads'); }}>WakeUp Premium · reclaim this space →</button></div></>;
      case 'ads': return <><div className="sponsored ad-creative"><span>WAKEUP BUSINESS PLATINUM · SPONSORED</span><AlarmClock size={64} /><h3>Own your morning.</h3><p>Lease the silence.</p><strong>$29.99 <small>/ month</small></strong><div className="loader"><div style={{ width: `${Math.min(100, elapsed / 30 * 100)}%` }} /></div></div><p>Advertisement · {Math.max(0, 30 - elapsed)} seconds remaining</p>{button('Continue', () => { complete('ads'); setGate(null); }, elapsed < 30)}</>;
      case 'queue': return <><div className="queue-number">{queue.toLocaleString()}</div><p>requests ahead of yours. Queue advancement occurs on this device.</p>{button('Buy priority placement', () => purchase('priority'), !!state.completed.priority)} {button('Continue to dismissal checkout', () => purchase('dismiss'), queue > 0)}<p>Need statutory clearance instead? {button('Apply for WAKE-1040', () => { setCaptchaFor('paperwork'); open('captcha'); }, false, true)}</p></>;
      case 'maintenance': return <><p>WAC-MNT-902 · Dismissal Authorization Service is undergoing scheduled maintenance. Essential alarm playback continues.</p><div className="detail">Next service window <strong>{new Date(state.maintenanceUntil).toLocaleTimeString()}</strong></div>{button('Retry authorization', () => setGate(null), now < state.maintenanceUntil)}</>;
      case 'rate': return <><div className="error-code">429</div><p>Six requests exceeded your dismissal allowance. Access resumes {new Date(state.lockedUntil).toLocaleString()}. Billing and other workspace functions remain available.</p></>;
      case 'region': return <><div className="detail">Licensed region <strong>{state.region}</strong></div><p>REG-451: Standard snoozing is restricted in JO and GB under the Regional Wakefulness Distribution Schedule. An exception may be issued for this transaction.</p>{button('Purchase one-time snooze exception', () => purchase(pendingSnooze.current))}</>;
      case 'rating': return <><p>Your purchased snooze is pending. Complete your review before the countdown begins.</p><div className="actions">{[1, 2, 3, 4, 5].map(n => <button className="button secondary" key={n} onClick={() => n === 5 ? activateSnooze() : notify('Ratings below five stars are currently incompatible with our business model.')}>{n} ★</button>)}</div></>;
      case 'dlc': return <><p>Mute is licensed separately from dismissal. This purchase permanently unlocks the mute control in this browser.</p><div className="subscription"><h3>Peace & Quiet</h3><strong>$49.99 / device</strong></div>{button('Buy expansion', () => purchase('dlc'))}</>;
      case 'accessibility': return <><p>Our accessibility controls require visual verification. The same local challenge service protects all human requests.</p>{button('Begin verification', () => { setCaptchaFor('accessibility'); open('captcha'); })}</>;
      case 'captcha': return captcha && <><p>{captcha.prompt}</p><div className="captcha-grid">{captcha.tiles.map((tile, i) => <button type="button" key={i} aria-label={`Tile ${i + 1}: ${tile}`} aria-pressed={selected.includes(i)} className={selected.includes(i) ? 'chosen' : ''} onClick={() => setSelected(s => s.includes(i) ? s.filter(v => v !== i) : [...s, i])}>{tile}</button>)}</div><p>{round} of 3 rounds confirmed</p>{button('Verify selection', () => { const valid = selected.length === captcha.correct.length && selected.every(v => captcha.correct.includes(v)); setCaptcha(makeCaptcha()); setSelected([]); if (!valid) { setRound(0); notify('Selection rejected. A fresh challenge has been issued.'); } else if (round < 2) { setRound(r => r + 1); notify('Human status provisionally acknowledged. Continue verification.'); } else { complete('captcha'); if (captchaFor === 'accessibility') { update({ accessibility: true }); complete('accessibility'); setGate(null); } else open('paperwork'); } })}</>;
      case 'paperwork': return state.paperwork ? <><p>Application {state.paperwork.reference} has been received.</p><div className="detail">Expected determination <strong>{new Date(state.paperwork.due).toLocaleDateString()}</strong></div>{button('Use approved determination', silence, now < state.paperwork.due)}{fast && button('Presenter: approve now', () => update({ paperwork: { ...state.paperwork!, due: Date.now() } }))}</> : <form onSubmit={e => { e.preventDefault(); update({ paperwork: { reference: `WAKE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, due: businessDue(3 + Math.floor(Math.random() * 3)) } }); complete('paperwork'); }}><span className="eyebrow">FORM WAKE-1040 · AUDIBLE TERMINATION REQUEST</span><label className="field">Synthetic applicant name<input required defaultValue="Demo Person" /></label><label className="field">Statement of necessity<textarea required minLength={10} value={input} onChange={e => setInput(e.target.value)} /></label><label className="consent"><input type="checkbox" required /> I declare that I intend to stop this alarm.</label><p>Processing takes 3–5 business days, excluding weekends. No government receives this application.</p><button className="button" type="submit">Submit application</button></form>;
      case 'cancel': { const hour = new Date().getHours(); const available = hour >= 22 || hour < 6 || fast; return <><p>Customer retention accepts cancellation calls during your sleeping hours: 22:00–06:00 local time. This is a simulated call.</p><div className="detail">Agent status <strong>{available ? 'Accepting sleepy callers' : 'Closed until 22:00'}</strong></div>{step === 0 ? button('Connect to retention agent', () => setStep(1), !available || !state.premium) : step === 1 ? <><p>Agent: Before I cancel, explain why wakefulness no longer meets your needs.</p><label className="field">Cancellation reason<textarea value={input} onChange={e => setInput(e.target.value)} /></label>{button('Submit reason', () => setStep(2), input.trim().length < 5)}</> : <><p>Agent: We can offer the same plan at the same price. Would you reconsider?</p>{button('Decline offer and cancel', () => { update({ premium: false }); complete('cancel'); setGate(null); notify('Premium canceled. Office-hours dismissal restored.'); })} {button('Keep Premium', () => setGate(null), false, true)}</>}</>; }
      case 'reset': return <><p>Your recovery link is available below.</p><div className="reset-url">/reset?token=LOCAL-DEMONSTRATION</div>{button('Open reset link', () => notify(inside ? 'Recovery authorized for synthetic Demo Person. Your account is restored.' : '401: Sign in before resetting the password you need to sign in.'))}</>;
      default: return null;
    }
  }

  if (!ready) return <div className="loading">Opening local workspace…</div>;
  const modal = gate && <div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-label={titles[gate]}><header className="dialog-header"><div><span className="eyebrow">WAKEUP ENTERPRISE · LOCAL SERVICES</span><h2>{titles[gate]}</h2></div>{!(gate === 'rating' && (paidSnooze.current || state.pendingSnooze)) && <button className="icon-button" aria-label="Close dialog" onClick={close}><X size={18} /></button>}</header><div className="dialog-content">{dialogContent()}</div><footer className="dialog-footer"><span>Processed on this device</span>{!(gate === 'rating' && (paidSnooze.current || state.pendingSnooze)) && <button className="text-button" onClick={close}>Return</button>}</footer></section></div>;
  const notice = message && <div className="notice" role="status"><span>{message}</span><button aria-label="Dismiss notification" onClick={() => setMessage('')}><X size={16} /></button></div>;
  if (!inside) return <div className="auth-shell"><header className="auth-header"><div className="wordmark"><span className="mark"><AlarmClock size={20} /></span>WakeUp <span className="wordmark-light">Enterprise</span></div><span className="auth-system">Local identity services</span></header><main className="auth-main"><section className="auth-card"><span className="eyebrow">WAKEUP IDENTITY SERVICES</span><h1>{['Create your account', 'Sign in to WakeUp', 'Create your account again', 'Account located'][login]}</h1>{login === 3 ? <><p>Your password belongs to demo.person@example.invalid, a synthetic account. We have assigned it to you.</p>{button('Go to workspace', () => { setInside(true); setPassword(''); encounter('account'); if (state.pendingSnooze) { pendingSnooze.current = state.pendingSnooze; paidSnooze.current = true; open('rating'); } else if (!state.completed.startup) open('startup'); })}</> : <form onSubmit={e => { e.preventDefault(); setLogin(n => n + 1); encounter('account'); notify(['An account already exists with that email. Sign in instead.', 'No account exists with that email. Register again.', 'That password belongs to Demo Person. We found your fictional account.'][login]); }}><p className="muted">Manage your schedule and continued eligibility for sleep.</p><label className="field">Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.invalid" /></label><label className="field">Password<input type="password" required minLength={3} value={password} onChange={e => setPassword(e.target.value)} /></label><button type="submit" className="button full">{login === 1 ? 'Sign in' : 'Continue'}</button><div className="auth-switch"><button type="button" onClick={() => open('reset')}>Forgot password?</button></div></form>}</section><p className="auth-legal">Local edition · Keep the browser open and device awake for alarms.</p></main>{modal}{notice}</div>;

  return <div className={`shell${state.accessibility ? ' accessible' : ''}`}><aside className="sidebar"><div className="brand"><span className="mark"><AlarmClock size={19} /></span><div>WakeUp <small>ENTERPRISE</small></div></div><div className="sidebar-heading">WORKSPACE</div><nav>{nav.map(item => <button key={item.key} className={`nav-link ${page === item.key ? 'is-active' : ''}`} onClick={() => { setPage(item.key); setMessage(''); if (item.key === 'rewards') encounter('battlepass'); if (item.key === 'billing') { encounter('debt'); encounter('credit'); } }}><item.icon size={17} />{item.label}</button>)}</nav><div className="sidebar-end"><div className="profile"><span className="avatar">DP</span><div><strong>Demo Person</strong><small>{state.premium ? 'Premium' : 'Free'} workspace</small></div></div><button className="signout" onClick={() => { setInside(false); setLogin(0); setGate(null); setCheckout(null); setEditor(null); }}><LogOut size={15} />Sign out</button></div></aside><main className="workspace"><header className="topbar"><span>Workspace / {nav.find(p => p.key === page)?.label}</span><span className="pill">Local edition</span></header><div className="content"><div className="heading"><div><span className="eyebrow">WORKSPACE SERVICES</span><h1>{nav.find(p => p.key === page)?.label}</h1><p className="muted">{page === 'alarms' ? 'Manage your wake-up schedule and associated services.' : 'WakeUp Enterprise · Device account'}</p></div>{page === 'alarms' && button('New alarm', () => { void enableAudio(); dailyThen(() => setEditor({ id: crypto.randomUUID(), time: '06:00', enabled: true, nextAt: 0 })); })}</div>
    {page === 'alarms' && <>
      {state.activeId && <div className="ring-banner"><div><span>{ringing ? 'ACTIVE ALARM' : 'SNOOZE ACTIVE'}</span><h2>{ringing ? 'Your alarm is ringing' : `${Math.max(0, Math.ceil((state.snoozeUntil - now) / 1000))} seconds remaining`}</h2><p>Sleep debt continues to accrue.</p></div>{ringing && <div className="actions">{button('Dismiss', dismiss)}{button('Snooze', () => snooze('snooze'), false, true)}</div>}</div>}
      {!audio && <div className="section-card slim"><p>Enable sound after opening this browser. Keep the browser open and your device awake.</p>{button('Enable sound', () => void enableAudio())}</div>}
      <section className="section-card"><div className="section-header"><h2>Scheduled alarms</h2><span>{state.alarms.length} alarms</span></div>{state.alarms.length ? state.alarms.map(a => <div className="alarm-row" key={a.id}><AlarmClock size={24} /><div className="alarm-description"><strong>{a.time}</strong><span>{a.enabled ? `Next: ${new Date(a.nextAt).toLocaleString()}` : 'Disabled'}</span></div><div className="actions">{button(a.enabled ? 'Disable' : 'Enable', () => { void enableAudio(); setState(s => ({ ...s, alarms: s.alarms.map(v => v.id === a.id ? { ...v, enabled: !v.enabled, nextAt: nextAlarm(v.time) } : v) })); }, false, true)}{button('Edit', () => setEditor({ ...a }), false, true)}{button('Delete', () => { setState(s => ({ ...s, alarms: s.alarms.filter(v => v.id !== a.id) })); }, a.id === state.activeId, true)}</div></div>) : <div className="empty"><Bell size={30} /><h3>No alarms scheduled</h3><p>Create an alarm to activate wakefulness services.</p></div>}</section>
      <div className="summary-row"><div className="metric"><span>Sleep credit score</span><strong>{state.score}<small> / 850</small></strong><p>{state.score < 500 ? 'Scheduling restricted to 06:00 or earlier' : 'Snoozing reduces your allowance'}</p></div><div className="metric"><span>Sleep Debt</span><strong>{money(Math.round(state.debt))}</strong><p>1¢ / minute plus 29.99% APR</p></div><div className="metric"><span>Fictional wallet</span><strong>{money(state.balance)}</strong><p>Overdraft permitted by corporate policy</p></div></div>
      <section className="section-card slim"><div><h2>Sound and notifications</h2><p>{audio ? 'Audio enabled for this browser session' : 'Audio needs permission'}</p></div><div className="volume-controls"><button className="icon-button" aria-label="Lower volume" onClick={() => { encounter('volume'); update({ volume: Math.min(100, state.volume + 10) }); notify('Negative numbers are not supported. Volume increased.'); open('sync'); setStep(Math.random() < .25 ? 1 : 0); }}><Volume2 size={18} /></button><input aria-label="Volume" type="range" value={state.volume} onChange={e => { update({ volume: +e.target.value }); encounter('sync'); }} onPointerUp={() => { open('sync'); setStep(Math.random() < .25 ? 1 : 0); }} onKeyUp={e => { if (e.key.startsWith('Arrow')) open('sync'); }} /><span>{state.volume}%</span><button className="icon-button" aria-label="Mute" onClick={() => state.dlc ? (update({ volume: 0 }), setAlarmVolume(0)) : open('dlc')}><VolumeX size={18} /></button></div></section>
    </>}
    {page === 'billing' && <><div className="billing-grid"><section className="section-card"><h2>Current plan</h2><div className="plan-price">{state.premium ? '$29.99' : '$0'}<small> / month</small></div><p>{state.premium ? 'Premium dismissal hours active.' : 'Free dismissal: 09:00–17:00; low credit ends at noon.'}</p>{button(state.premium ? 'Cancel subscription' : 'Upgrade to Premium', () => state.premium ? open('cancel') : purchase('premium'))}</section><section className="section-card"><h2>Sleep Debt statement</h2><div className="plan-price">{money(Math.round(state.debt))}</div><p>1¢ principal per sleeping minute. Interest compounds by minute at 29.99% nominal APR.</p><p>Credit score: {state.score} / 850. {state.score < 500 ? '50%' : state.score < 600 ? '25%' : '0%'} snooze credit adjustment.</p><p>Current snooze base: {money(snoozePrice(state.snoozes, state.score))}.</p></section></div><section className="section-card"><div className="section-header"><h2>Invoices</h2>{button('Download statement', exportStatement, false, true)}</div>{state.receipts.length ? state.receipts.map(r => <details key={r.id} className="receipt"><summary>{r.title} · {money(r.total)} · {r.id}</summary><p>{new Date(r.at).toLocaleString()}</p><div className="invoice-list">{r.lines.map(l => <div key={l.label}><span>{l.label}</span><strong>{money(l.cents)}</strong></div>)}<div className="invoice-total"><span>Total</span><strong>{money(r.total)}</strong></div></div></details>) : <p>No local transactions.</p>}</section></>}
    {page === 'rewards' && <><section className="section-card"><div className="rewards-top"><span>ALARM BATTLE PASS · SEASON 01</span><strong>Level {level}</strong></div><h2>Progress toward a better morning</h2><div className="loader"><div style={{ width: `${state.xp % 100}%` }} /></div><p>{state.xp} XP · Dismissal +25 XP · Snooze +5 XP</p>{button(state.rewardDay === day() ? 'Daily reward claimed' : 'Claim daily reward (+5 XP)', () => update({ xp: state.xp + 5, rewardDay: day() }), state.rewardDay === day())}{row('Alarm sounds', 'Alternative sounds unlock at level 30.', level >= 30 ? <select aria-label="Alarm sound" value={state.sound} onChange={e => update({ sound: e.target.value as SavedState['sound'] })}><option value="standard">Standard pulse</option><option value="chime">Corporate chime</option></select> : <span>Level 30 required</span>)}{[1, 10, 20, 30].map(n => <div className="detail" key={n}><span>Level {n}</span><strong>{n === 30 ? 'Sound customization' : n === 20 ? 'Senior Sleeper designation' : n === 10 ? 'Sleep Associate designation' : 'Standard pulse'} · {level >= n ? 'Unlocked' : 'Locked'}</strong></div>)}</section><section className="section-card">{row('Random snooze crate', 'An equal chance of 0 through 60 seconds.', button('Buy crate · $2.99', () => snooze('loot'), !ringing))}</section></>}
    {page === 'settings' && <section className="section-card"><h2>Device and account</h2>{row('Account recovery', 'Locally issued recovery links.', button('Recover account', () => open('reset'), false, true))}{row('Regional licensing', `Current region: ${state.region}. JO and GB require snooze exceptions.`, <span>Device locale policy</span>)}{row('Cookie preferences', state.cookies === false ? 'Optional consent rejected; silence rights revoked.' : 'Manage local consent.', button('Configure cookies', () => open('cookies'), false, true))}{row('Privacy notice', 'Corporate review advances at one pixel per second.', button('Read privacy policy', () => open('privacy'), false, true))}{row('Accessibility', state.accessibility ? 'Larger controls and higher contrast enabled.' : 'Visual verification required.', button(state.accessibility ? 'Disable' : 'Enable', () => state.accessibility ? update({ accessibility: false }) : open('accessibility'), false, true))}<p className="muted">Presenter tools: Ctrl+Shift+D {button('Open presenter panel', () => setTools(true), false, true)}</p></section>}
    {page === 'support' && <section className="section-card"><h2>Customer support</h2>{row('Subscription cancellation', 'Interactive retention assistance during sleeping hours.', button('Call local support', () => open('cancel'), !state.premium, true))}{row('Dismissal paperwork', 'Form WAKE-1040 · 3–5 business days.', button('Start application', () => { setCaptchaFor('paperwork'); open('captcha'); }, !ringing, true))}{row('Service status', state.maintenanceUntil > now ? 'Scheduled maintenance in progress.' : 'Authorization service available.', button('View maintenance', () => open('maintenance'), false, true))}{state.paperwork && <p>Application {state.paperwork.reference} · expected {new Date(state.paperwork.due).toLocaleDateString()}</p>}</section>}
  </div></main>{notice}{modal}
  {editor && <div className="overlay"><form className="dialog small" role="dialog" aria-modal="true" aria-label="Alarm settings" onSubmit={e => { e.preventDefault(); saveAlarm(); }}><header className="dialog-header"><h2>Alarm settings</h2><button type="button" className="icon-button" aria-label="Close editor" onClick={() => setEditor(null)}><X size={18} /></button></header><div className="dialog-content"><label className="field">Alarm time<input type="time" required value={editor.time} onChange={e => setEditor({ ...editor, time: e.target.value })} /></label><p>Repeats daily in device time. A refresh catches up missed appointments while the browser is running.</p></div><footer className="dialog-footer"><button className="button" type="submit">Save alarm</button>{button('Cancel', () => setEditor(null), false, true)}</footer></form></div>}
  {checkout && <div className="overlay payment-layer"><section className="dialog checkout-dialog" role="dialog" aria-modal="true" aria-label="WakeUp checkout"><header className="dialog-header"><div><span className="eyebrow">WAKEUP PAYMENTS · LOCAL SIMULATION</span><h2>{checkout.paid ? 'Payment receipt' : 'Review and pay'}</h2></div>{!checkout.paid && <button className="icon-button" aria-label="Close checkout" onClick={() => setCheckout(null)}><X size={18} /></button>}</header><div className="dialog-content"><div className="checkout-order"><span>Order {checkout.id}</span><strong>{checkout.title}</strong><small>Demonstration wallet · no real payment details</small></div>{checkout.kind === 'dismiss' && !checkout.paid && <fieldset><legend>Tip your alarm</legend><div className="actions">{[0, 20, 25, 30].map(n => <button type="button" key={n} className={`button ${tip === n ? '' : 'secondary'}`} aria-pressed={tip === n} onClick={() => setTip(n)}>{n ? `${n}%` : 'No tip'}</button>)}</div></fieldset>}<div className="invoice-list">{(checkout.paid || invoice(checkout.base, checkout.peak, tip)).lines.map(l => <div key={l.label}><span>{l.label}</span><strong>{money(l.cents)}</strong></div>)}<div className="invoice-total"><span>Total</span><strong>{money((checkout.paid || invoice(checkout.base, checkout.peak, tip)).total)}</strong></div></div>{checkout.paid ? <><p>Approved · receipt saved in Billing.</p>{button('Complete purchase', returnFromPayment)}</> : <><label className="field">Fictional payment method<select value={decline ? 'decline' : 'approve'} onChange={e => setDecline(e.target.value === 'decline')}><option value="approve">Demo wallet · approved</option><option value="decline">Demo wallet · simulated decline</option></select></label><p>Wallet overdraft is simulated. No real transaction occurs.</p>{button(`Pay ${money(invoice(checkout.base, checkout.peak, tip).total)}`, pay)}</>}</div></section></div>}
  {tools && <div className="overlay developer-layer"><section className="dialog developer-dialog" role="dialog" aria-modal="true" aria-label="Presenter controls"><header className="dialog-header"><h2>Local presenter controls</h2>{button('Close', () => setTools(false), false, true)}</header><div className="dialog-content"><div className="actions">{button('Trigger alarm now', () => { trigger(); setTools(false); })}{button('Stop / clear lockout', () => { update({ activeId: null, snoozeUntil: 0, pendingSnooze: null, lockedUntil: 0, attempts: 0 }); setGate(null); stopAlarmSound(); })}{button('Reset workspace', () => { resetSession(); setTools(false); })}{button('Reset discovery', () => update({ encounters: {}, completed: {} }))}{button('Reset finances', () => update({ balance: 2500, debt: 0, receipts: [], snoozes: 0, premium: false, dlc: false }))}</div><label className="consent"><input type="checkbox" checked={fast} onChange={e => setFast(e.target.checked)} /> Accelerate timers and support hours</label><label className="consent"><input type="checkbox" checked={state.premium} onChange={e => update({ premium: e.target.checked })} /> Premium entitlement</label><label className="field">Credit score<input type="number" min={0} max={850} value={state.score} onChange={e => update({ score: Math.max(0, Math.min(850, +e.target.value)) })} /></label><label className="field">Experience points<input type="number" min={0} value={state.xp} onChange={e => update({ xp: Math.max(0, +e.target.value) })} /></label><label className="field">Simulated region<select value={state.region} onChange={e => update({ region: e.target.value })}><option value={state.region}>{state.region}</option>{['JO', 'GB', 'US', 'DE'].filter(r => r !== state.region).map(r => <option key={r}>{r}</option>)}</select></label><p>{features.filter(f => state.encounters[f.id]).length} of 37 features encountered · automatic surveys disabled</p><div className="feature-tools">{features.map(f => <button className="button secondary" key={f.id} onClick={() => showFeature(f.id)}>{state.encounters[f.id] ? '✓ ' : ''}{f.title}</button>)}</div><details><summary>Inspect session state</summary><pre>{JSON.stringify(state, null, 2)}</pre></details></div></section></div>}
  </div>;
}

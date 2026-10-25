'use client';
import type { useAlarmController } from './use-alarm-controller.tsx';
import { AlarmClock, Bell, CircleHelp, Volume2, VolumeX } from 'lucide-react';
import { money, nextAlarm, snoozePrice } from '@/lib/rules.ts';
import { setAlarmVolume } from '@/lib/audio.ts';
import { Dialog, Notice, Sidebar } from './ui.tsx';
import { AlarmEditor } from './alarm-editor.tsx';
import { AuthScreen } from './auth-screen.tsx';
import { GateContent } from './gate-content.tsx';
import { CheckoutPanel } from './checkout-panel.tsx';
import { PresenterPanel } from './presenter-panel.tsx';
import type { SavedState } from '@/lib/storage.ts';
import { day, nav } from "@/app/config.ts";

export function AlarmView({app}: {app: ReturnType<typeof useAlarmController>}) {
    const { state, setState, ready, login, setLogin, inside, setInside, email, setEmail, password, setPassword, message, setMessage, page, setPage, gate, setStep, now, setTools, setCaptchaFor, editor, setEditor, audio, online, networkRetry, pendingSnooze, paidSnooze, level, ringing, update, notify, encounter, open, close, dailyThen, enableAudio, afterForm, dismiss, purchase, snooze, saveAlarm, exportStatement, signOut, resetSession, button, row } = app;
    if (!ready) return <div className="loading">Connecting to WakeUp Enterprise…</div>;
    if (!online) return <main className="connection-error" role="alert">
        <div><CircleHelp size={42}/><h1>This site can’t be reached</h1><p><strong>WakeUp Enterprise</strong> could not
            establish a connection to the licensing service.</p><p>Check your Wi-Fi connection and try again.</p>
            <code>ERR_INTERNET_DISCONNECTED</code>
            <div
                className="actions">{button('Retry connection', () => void networkRetry.current())}{button('Reset workspace', resetSession, false, true)}</div>
        </div>
    </main>;
    const cannotClose = gate === 'survey' || (gate === 'rating' && (paidSnooze.current || state.pendingSnooze));
    const modal = gate && <Dialog gate={gate} content={<GateContent app={app}/>} close={close}
                                  canClose={!cannotClose} canReturn={gate !== 'rating' || !cannotClose}/>;
    const notice = <Notice message={message} dismiss={() => setMessage('')}/>;
    if (!inside) return <>
        <AuthScreen login={login} email={email} password={password} setEmail={setEmail}
                    setPassword={setPassword} submit={() => {
            setLogin(n => n + 1);
            encounter('account');
            notify(['An account already exists with that email. Sign in instead.',
                'No account exists with that email. Register again.',
                'That password belongs to Jordan Miller. We located your account.'][login]);
            afterForm(() => {
            });
        }} reset={() => open('reset')} enter={() => {
            setInside(true);
            setPassword('');
            encounter('account');
            if (state.pendingSurvey) open('survey');
            else if (state.pendingSnooze) {
                pendingSnooze.current = state.pendingSnooze;
                paidSnooze.current = true;
                open('rating');
            } else if (!state.completed.startup) open('startup');
        }}/>
        {modal}{notice}
    </>;

    return <div className={`shell${state.accessibility ? ' accessible' : ''}`}>
        <Sidebar page={page} premium={state.premium} signOut={signOut} navigate={nextPage => {
            setPage(nextPage);
            setMessage('');
            if (nextPage === 'rewards') encounter('battlepass');
            if (nextPage === 'billing') {
                encounter('debt');
                encounter('credit');
            }
        }}/>
        <main className="workspace">
            <header className="topbar"><span>Workspace / {nav.find(p => p.key === page)?.label}</span><span
                className="pill">WakeUp Enterprise</span></header>
            <div className="content">
                <div className="heading">
                    <div><span className="eyebrow">WORKSPACE SERVICES</span>
                        <h1>{nav.find(p => p.key === page)?.label}</h1><p
                            className="muted">{page === 'alarms' ? 'Manage your wake-up schedule and associated services.' : 'WakeUp Enterprise · Device account'}</p>
                    </div>
                    {page === 'alarms' && button('New alarm', () => {
                        void enableAudio();
                        dailyThen(() => setEditor({id: crypto.randomUUID(), time: '06:00', enabled: true, nextAt: 0}));
                    })}</div>
                {page === 'alarms' && <>
                    {state.activeId && <div className="ring-banner">
                        <div><span>{ringing ? 'ACTIVE ALARM' : 'SNOOZE ACTIVE'}</span>
                            <h2>{ringing ? 'Your alarm is ringing' : `${Math.max(0, Math.ceil((state.snoozeUntil - now) / 1000))} seconds remaining`}</h2>
                            <p>Sleep debt continues to accrue.</p></div>
                        {ringing && <div
                            className="actions">{button('Dismiss', dismiss)}{button('Snooze', () => snooze('snooze'), false, true)}</div>}
                    </div>}
                    {!audio &&
                        <div className="section-card slim"><p>Enable sound after opening this browser. Keep the browser
                            open and your device awake.</p>{button('Enable sound', () => void enableAudio())}</div>}
                    <section className="section-card">
                        <div className="section-header"><h2>Scheduled alarms</h2>
                            <span>{state.alarms.length} alarms</span></div>
                        {state.alarms.length ? state.alarms.map(a => <div className="alarm-row" key={a.id}><AlarmClock
                                size={24}/>
                                <div className="alarm-description">
                                    <strong>{a.time}</strong><span>{a.enabled ? `Next: ${new Date(a.nextAt).toLocaleString()}` : 'Disabled'}</span>
                                </div>
                                <div className="actions">{button(a.enabled ? 'Disable' : 'Enable', () => {
                                    void enableAudio();
                                    setState(s => ({
                                        ...s,
                                        alarms: s.alarms.map(v => v.id === a.id ? {
                                            ...v,
                                            enabled: !v.enabled,
                                            nextAt: nextAlarm(v.time)
                                        } : v)
                                    }));
                                }, false, true)}{button('Edit', () => setEditor({...a}), false, true)}{button('Delete', () => {
                                    setState(s => ({...s, alarms: s.alarms.filter(v => v.id !== a.id)}));
                                }, a.id === state.activeId, true)}</div>
                            </div>) :
                            <div className="empty"><Bell size={30}/><h3>No alarms scheduled</h3><p>Create an alarm to
                                activate wakefulness services.</p></div>}</section>
                    <div className="summary-row">
                        <div className="metric"><span>Sleep credit score</span><strong>{state.score}<small> /
                            850</small></strong>
                            <p>{state.score < 500 ? 'Scheduling restricted to 06:00 or earlier' : 'Snoozing reduces your allowance'}</p>
                        </div>
                        <div className="metric"><span>Sleep Debt</span><strong>{money(Math.round(state.debt))}</strong>
                            <p>1¢ / minute plus 29.99% APR</p></div>
                        <div className="metric"><span>Account balance</span><strong>{money(state.balance)}</strong>
                            <p>Overdraft permitted by corporate policy</p></div>
                    </div>
                    <section className="section-card slim">
                        <div><h2>Sound and notifications</h2>
                            <p>{audio ? 'Audio enabled for this browser session' : 'Audio needs permission'}</p></div>
                        <div className="volume-controls">
                            <button className="icon-button" aria-label="Lower volume" onClick={() => {
                                encounter('volume');
                                update({volume: Math.min(100, state.volume + 10)});
                                notify('Negative numbers are not supported. Volume increased.');
                                open('sync');
                                setStep(Math.random() < .25 ? 1 : 0);
                            }}><Volume2 size={18}/></button>
                            <input aria-label="Volume" type="range" value={state.volume} onChange={e => {
                                update({volume: +e.target.value});
                                encounter('sync');
                            }} onPointerUp={() => {
                                open('sync');
                                setStep(Math.random() < .25 ? 1 : 0);
                            }} onKeyUp={e => {
                                if (e.key.startsWith('Arrow')) open('sync');
                            }}/><span>{state.volume}%</span>
                            <button
                                className="icon-button"
                                aria-label="Mute"
                                onClick={() => {
                                    if (state.dlc) {
                                        update({volume: 0});
                                        setAlarmVolume(0);
                                    } else {
                                        open('dlc');
                                    }
                                }}
                            >
                                <VolumeX size={18}/>
                            </button>
                        </div>
                    </section>
                </>}
                {page === 'billing' && <>
                    <div className="billing-grid">
                        <section className="section-card"><h2>Current plan</h2>
                            <div className="plan-price">{state.premium ? '$29.99' : '$0'}<small> / month</small></div>
                            <p>{state.premium ? 'Premium dismissal hours active.' : 'Free dismissal: 09:00–17:00; low credit ends at noon.'}</p>{button(state.premium ? 'Cancel subscription' : 'Upgrade to Premium', () => state.premium ? open('cancel') : purchase('premium'))}
                        </section>
                        <section className="section-card"><h2>Sleep Debt statement</h2>
                            <div className="plan-price">{money(Math.round(state.debt))}</div>
                            <p>1¢ principal per sleeping minute. Interest compounds by minute at 29.99% nominal APR.</p>
                            <p>Credit score: {state.score} /
                                850. {state.score < 500 ? '50%' : state.score < 600 ? '25%' : '0%'} snooze credit
                                adjustment.</p><p>Current snooze
                                base: {money(snoozePrice(state.snoozes, state.score))}.</p></section>
                    </div>
                    <section className="section-card">
                        <div className="section-header">
                            <h2>Invoices</h2>{button('Download statement', exportStatement, false, true)}</div>
                        {state.receipts.length ? state.receipts.map(r => <details key={r.id} className="receipt">
                            <summary>{r.title} · {money(r.total)} · {r.id}</summary>
                            <p>{new Date(r.at).toLocaleString()}</p>
                            <div className="invoice-list">{r.lines.map(l => <div key={l.label}>
                                <span>{l.label}</span><strong>{money(l.cents)}</strong></div>)}
                                <div className="invoice-total"><span>Total</span><strong>{money(r.total)}</strong></div>
                            </div>
                        </details>) : <p>No transactions recorded.</p>}</section>
                </>}
                {page === 'rewards' && <>
                    <section className="section-card">
                        <div className="rewards-top">
                            <span>ALARM BATTLE PASS · SEASON 01</span><strong>Level {level}</strong></div>
                        <h2>Progress toward a better morning</h2>
                        <div className="loader">
                            <div style={{width: `${state.xp % 100}%`}}/>
                        </div>
                        <p>{state.xp} XP · Dismissal +25 XP · Snooze +5
                            XP</p>{button(state.rewardDay === day() ? 'Daily reward claimed' : 'Claim daily reward (+5 XP)', () => update({
                        xp: state.xp + 5,
                        rewardDay: day()
                    }), state.rewardDay === day())}{row('Alarm sounds', 'Alternative sounds unlock at level 30.', level >= 30 ?
                        <select aria-label="Alarm sound" value={state.sound}
                                onChange={e => update({sound: e.target.value as SavedState['sound']})}>
                            <option value="standard">Standard pulse</option>
                            <option value="chime">Corporate chime</option>
                        </select> : <span>Level 30 required</span>)}{[1, 10, 20, 30].map(n => <div className="detail"
                                                                                                   key={n}>
                        <span>Level {n}</span><strong>{n === 30 ? 'Sound customization' : n === 20 ? 'Senior Sleeper designation' : n === 10 ? 'Sleep Associate designation' : 'Standard pulse'} · {level >= n ? 'Unlocked' : 'Locked'}</strong>
                    </div>)}</section>
                    <section
                        className="section-card">{row('Random snooze crate', 'An equal chance of 0 through 60 seconds.', button('Buy crate · $2.99', () => snooze('loot'), !ringing))}</section>
                </>}
                {page === 'settings' && <section className="section-card"><h2>Device and
                    account</h2>{row('Account recovery', 'Request account recovery.', button('Recover account', () => open('reset'), false, true))}{row(
                    'Regional licensing', `Current region: ${state.region}. JO and GB require snooze exceptions.`,
                    <span>Regional service policy</span>
                )}{row('Cookie preferences', state.cookies === false ? 'Optional consent rejected; silence rights revoked.' : 'Manage consent preferences.', button('Configure cookies', () => open('cookies'), false, true))}{row('Privacy notice', 'Corporate review advances at one pixel per second.', button('Read privacy policy', () => open('privacy'), false, true))}{row('Accessibility', state.accessibility ? 'Larger controls and higher contrast enabled.' : 'Visual verification required.', button(state.accessibility ? 'Disable' : 'Enable', () => state.accessibility ? update({accessibility: false}) : open('accessibility'), false, true))}
                    <p className="muted">Presenter tools:
                        Ctrl+Shift+D {button('Open presenter panel', () => setTools(true), false, true)}</p></section>}
                {page === 'support' && <section className="section-card"><h2>Customer
                    support</h2>{row('Subscription cancellation', 'Interactive retention assistance during sleeping hours.', button('Call support', () => open('cancel'), !state.premium, true))}{row('Dismissal paperwork', 'Form WAKE-1040 · 3–5 business days.', button('Start application', () => {
                    setCaptchaFor('paperwork');
                    open('captcha');
                }, !ringing, true))}{row('Service status', state.maintenanceUntil > now ? 'Scheduled maintenance in progress.' : 'Authorization service available.', button('View maintenance', () => open('maintenance'), false, true))}{state.paperwork &&
                    <p>Application {state.paperwork.reference} ·
                        expected {new Date(state.paperwork.due).toLocaleDateString()}</p>}</section>}
            </div>
        </main>
        {notice}{modal}
        {editor && <AlarmEditor alarm={editor} change={setEditor} save={saveAlarm}
                                cancel={() => setEditor(null)}/>}
        <CheckoutPanel app={app}/><PresenterPanel app={app}/>
    </div>;
}

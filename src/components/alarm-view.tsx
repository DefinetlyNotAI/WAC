'use client';
import type { useAlarmController } from './use-alarm-controller';
import { CircleHelp } from 'lucide-react';
import { Dialog, Notice, Sidebar } from './ui';
import { AlarmEditor } from './alarm-editor';
import { AuthScreen } from './auth-screen';
import { GateContent } from './gate-content';
import { CheckoutPanel } from './checkout-panel';
import { PresenterPanel } from './presenter-panel';
import { nav } from '@/app/config';
import { button } from './ui-controls';
import { AlarmsPage } from './pages/alarms-page';
import { BillingPage } from './pages/billing-page';
import { RewardsPage } from './pages/rewards-page';
import { SettingsPage } from './pages/settings-page';
import { SupportPage } from './pages/support-page';

export function AlarmView({app}: {app: ReturnType<typeof useAlarmController>}) {
    const { state, ready, login, setLogin, inside, setInside, email, setEmail, password, setPassword, message, setMessage, page, setPage, gate, online, retryNetwork, pendingSnooze, paidSnooze, editor, setEditor, notify, encounter, open, close, enableAudio, afterForm, saveAlarm, signOut, resetSession } = app;
    if (!ready) return <div className="loading">Connecting to WakeUp Enterprise…</div>;
    if (!online) return <main className="connection-error" role="alert">
        <div><CircleHelp size={42}/><h1>This site can’t be reached</h1><p><strong>WakeUp Enterprise</strong> could not
            establish a connection to the licensing service.</p><p>Check your Wi-Fi connection and try again.</p>
            <code>ERR_INTERNET_DISCONNECTED</code>
            <div
                className="actions">{button('Retry connection', () => void retryNetwork())}{button('Reset workspace', resetSession, false, true)}</div>
        </div>
    </main>;
    const cannotClose = gate === 'survey' || (gate === 'rating' && (paidSnooze.current || state.pendingSnooze));
    const modal = gate && <Dialog gate={gate} content={<GateContent app={app}/>} close={close}
                                  canClose={!cannotClose} canReturn={gate !== 'rating' || !cannotClose}/>;
    const notice = <Notice message={message} dismiss={() => setMessage('')}/>;
    if (!inside) return <>
        <AuthScreen login={login} email={email} password={password} setEmail={setEmail}
                    setPassword={setPassword} submit={() => {
            setLogin(previous => Math.min(3, previous + 1));
            encounter('account');
            const replies = [
                'An account already exists with that email. Sign in instead.',
                'No account exists with that email. Register again.',
                'That password belongs to Jordan Miller. We located your account.'
            ];
            notify(replies[Math.min(login, replies.length - 1)]);
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
                        app.dailyThen(() => setEditor({id: crypto.randomUUID(), time: '06:00', enabled: true, nextAt: 0}));
                    })}</div>
                {page === 'alarms' && <AlarmsPage app={app}/>}
                {page === 'billing' && <BillingPage app={app}/>}
                {page === 'rewards' && <RewardsPage app={app}/>}
                {page === 'settings' && <SettingsPage app={app}/>}
                {page === 'support' && <SupportPage app={app}/>}
            </div>
        </main>
        {notice}{modal}
        {editor && <AlarmEditor alarm={editor} change={setEditor} save={saveAlarm}
                                cancel={() => setEditor(null)}/>}
        <CheckoutPanel app={app}/><PresenterPanel app={app}/>
    </div>;
}

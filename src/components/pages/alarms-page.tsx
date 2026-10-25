'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button } from '../ui-controls';
import { AlarmClock, Bell, Volume2, VolumeX } from 'lucide-react';
import { money, nextAlarm } from '@/lib/rules';
import { setAlarmVolume } from '@/lib/audio';

export function AlarmsPage({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { state, setState, now, ringing, audio, encounter, update, notify, open, setStep, enableAudio, setEditor, dismiss, snooze } = app;
    return <>

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
                
    </>;
}

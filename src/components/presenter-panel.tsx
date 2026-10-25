'use client';
import type { useAlarmController } from './use-alarm-controller.tsx';
import { stopAlarmSound } from '@/lib/audio.ts';
import { features } from '@/lib/features.ts';
import { button } from './ui-controls';

export function PresenterPanel({app}: {app: ReturnType<typeof useAlarmController>}) {
    const { state, setGate, fast, setFast, tools, setTools, update, trigger, resetSession, showFeature } = app;
    return <>
        {tools && <div className="overlay developer-layer">
            <section className="dialog developer-dialog" role="dialog" aria-modal="true"
                     aria-label="Presenter controls">
                <header className="dialog-header"><h2>Presenter
                    controls</h2>{button('Close', () => setTools(false), false, true)}</header>
                <div className="dialog-content">
                    <div className="actions">{button('Trigger alarm now', () => {
                        trigger();
                        setTools(false);
                    })}{button('Stop / clear lockout', () => {
                        update({activeId: null, snoozeUntil: 0, pendingSnooze: null, lockedUntil: 0, attempts: 0});
                        setGate(null);
                        stopAlarmSound();
                    })}{button('Reset workspace', () => {
                        resetSession();
                        setTools(false);
                    })}{button('Reset discovery', () => update({
                        encounters: {},
                        completed: {}
                    }))}{button('Reset finances', () => update({
                        balance: 2500,
                        debt: 0,
                        receipts: [],
                        snoozes: 0,
                        premium: false,
                        dlc: false
                    }))}</div>
                    <label className="consent"><input type="checkbox" checked={fast}
                                                      onChange={e => setFast(e.target.checked)}/> Accelerate timers and
                        support hours</label><label className="consent"><input type="checkbox" checked={state.premium}
                                                                               onChange={e => update({premium: e.target.checked})}/> Premium
                    entitlement</label><label className="field">Credit score<input type="number" min={0} max={850}
                                                                                   value={state.score}
                                                                                   onChange={e => update({score: Math.max(0, Math.min(850, +e.target.value))})}/></label><label
                    className="field">Experience points<input type="number" min={0} value={state.xp}
                                                              onChange={e => update({xp: Math.max(0, +e.target.value)})}/></label><label
                    className="field">Region override<select value={state.region}
                                                             onChange={e => update({region: e.target.value})}>
                    <option value={state.region}>{state.region}</option>
                    {['JO', 'GB', 'US', 'DE'].filter(r => r !== state.region).map(r => <option key={r}>{r}</option>)}
                </select></label><p>{features.filter(f => state.encounters[f.id]).length} of 37 features encountered ·
                    form-completion surveys enabled</p>
                    <div className="feature-tools">{features.map(f => <button className="button secondary" key={f.id}
                                                                              onClick={() => showFeature(f.id)}>{state.encounters[f.id] ? '✓ ' : ''}{f.title}</button>)}</div>
                    <details>
                        <summary>Inspect session state</summary>
                        <pre>{JSON.stringify(state, null, 2)}</pre>
                    </details>
                </div>
            </section>
        </div>}
    </>;
}

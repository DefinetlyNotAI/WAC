'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button, stars } from '../ui-controls';
import { validApplication, wordCount, businessDue } from '@/lib/rules';

export function SupportGates({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { gate, state, inside, setGate, step, setStep, now, fast, input, setInput, setDismissing, afterSurvey, update, notify, complete, open, afterForm } = app;
    switch (gate) {
            case 'survey':
                return <><p>Before we finish processing your form, rate the efficiency of this
                    interaction.</p>{stars(Number(input), n => {
                    setInput(String(n));
                    if (n < 5) notify('Ratings below five stars cannot be accepted. Please select five stars.');
                })}{button('Submit required feedback', () => {
                    if (input !== '5') return;
                    update({pendingSurvey: false});
                    complete('survey');
                    setGate(null);
                    const next = afterSurvey.current;
                    afterSurvey.current = () => {
                    };
                    next();
                }, input !== '5')}</>;
            case 'paperwork':
                return state.paperwork ? <><p>Application {state.paperwork.reference} has been received.</p>
                    <div className="detail">Expected
                        determination <strong>{new Date(state.paperwork.due).toLocaleDateString()}</strong></div>
                    {button('Use approved determination', () => {
                        setDismissing(true);
                        setGate(null);
                    }, now < state.paperwork.due)}{fast && button('Presenter: approve now', () => update({
                        paperwork: {
                            ...state.paperwork!,
                            due: Date.now()
                        }
                    }))}</> : <form onSubmit={e => {
                    e.preventDefault();
                    if (!validApplication(input)) {
                        notify('Your statement must contain exactly 500 words.');
                        return;
                    }
                    update({
                        paperwork: {
                            reference: `WAKE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
                            due: businessDue(3 + Math.floor(Math.random() * 3))
                        }
                    });
                    complete('paperwork');
                    afterForm(() => open('paperwork'));
                }}><span className="eyebrow">FORM WAKE-1040 · AUDIBLE TERMINATION REQUEST</span><label
                    className="field">Applicant name<input required defaultValue="Jordan Miller"/></label><label
                    className="field">Statement of necessity<textarea required value={input}
                                                                      onChange={e => setInput(e.target.value)}/></label>
                    <p aria-live="polite">{wordCount(input)} / 500 words · exactly 500 required</p><label
                        className="consent"><input type="checkbox" required/> I declare that I intend to stop this
                        alarm.</label><p>Processing takes 3–5 business days, excluding weekends. Submit a statement of
                        exactly 500 words.</p>
                    <button className="button" type="submit" disabled={!validApplication(input)}>Submit application
                    </button>
                </form>;
            case 'cancel': {
                const hour = new Date().getHours();
                const available = hour >= 22 || hour < 6 || fast;
                return <><p>Customer retention accepts cancellation calls during your sleeping hours: 22:00–06:00 local
                    time. Calls are monitored for retention compliance.</p>
                    <div className="detail">Agent
                        status <strong>{available ? 'Accepting sleepy callers' : 'Closed until 22:00'}</strong></div>
                    {step === 0 ? button('Connect to retention agent', () => setStep(1), !available || !state.premium) : step === 1 ? <>
                        <p>Agent: Before I cancel, explain why wakefulness no longer meets your needs.</p><label
                        className="field">Cancellation reason<textarea value={input}
                                                                       onChange={e => setInput(e.target.value)}/></label>{button('Submit reason', () => afterForm(() => {
                        open('cancel');
                        setStep(2);
                    }), input.trim().length < 5)}</> : <><p>Agent: We can offer the same plan at the same price. Would
                        you reconsider?</p>{button('Decline offer and cancel', () => {
                        update({premium: false});
                        complete('cancel');
                        setGate(null);
                        notify('Premium canceled. Office-hours dismissal restored.');
                    })} {button('Keep Premium', () => setGate(null), false, true)}</>}</>;
            }
            case 'reset':
                return <><p>Your recovery link is available below.</p>
                    <div className="reset-url">/reset?token=RECOVERY-PENDING</div>
                    {button('Open reset link', () => notify(inside ? 'Recovery authorized for Jordan Miller. Your account is restored.' : '401: Sign in before resetting the password you need to sign in.'))}</>;
        default: return null;
    }
}

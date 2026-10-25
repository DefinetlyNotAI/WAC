'use client';
import type { useAlarmController } from './use-alarm-controller.tsx';
import { AlarmClock } from 'lucide-react';
import { terms, privacy } from '@/lib/legal.ts';
import { makeCaptcha, validApplication, wordCount, businessDue } from '@/lib/rules.ts';
import { totp } from '@/lib/totp.ts';
import { day } from "@/app/config.ts";

export function GateContent({app}: {app: ReturnType<typeof useAlarmController>}) {
    const { state, inside, gate, setGate, step, setStep, elapsed, now, fast, input, setInput, code, setCode, round, setRound, captcha, setCaptcha, selected, setSelected, captchaFor, setCaptchaFor, queue, privacyY, privacyEnd, online, setDismissing, captchaOrder, refusalPosition, refusalRef, afterSurvey, sessionVersion, privacyRef, resume, pendingSnooze, update, notify, complete, open, afterForm, purchase, activateSnooze, signOut, stars, button } = app;
        switch (gate) {
            case 'startup':
                return <>
                    <div className="loader">
                        <div style={{width: `${elapsed < 8 ? Math.min(99, elapsed * 20) : 100}%`}}/>
                    </div>
                    <p>{elapsed < 5 ? 'Downloading wakefulness.exe' : elapsed < 8 ? '99% · Waiting for the last byte of initiative…' : 'Verifying downloaded consciousness · signature accepted'}</p>{button('Open workspace', () => {
                    complete('startup');
                    setGate(null);
                }, elapsed < 10)}</>;
            case 'onboarding': {
                const lessons = [
                    'An alarm makes a sound at a scheduled time.',
                    'Keep this browser open and your device awake.',
                    'Enable sound once after opening the application.',
                    'Stopping sound requires an authorized dismissal.'
                ];

                const lastStep = step === lessons.length - 1;

                function handleNext() {
                    if (lastStep) {
                        complete('onboarding');
                        open('terms');
                    } else {
                        setStep(s => s + 1);
                    }
                }

                return (
                    <>
                        <span className="eyebrow">
                            LESSON {step + 1} OF {lessons.length}
                        </span>

                        <h3>{lessons[step]}</h3>

                        <p>Morning certification · {day()}</p>

                        {button(
                            lastStep ? 'Review today’s agreement' : 'Acknowledge lesson',
                            handleNext
                        )}
                    </>
                );
            }
            case 'terms':
                return <><span className="eyebrow">PAGE {step + 1} OF 47</span><h3>{terms[step][0]}</h3>
                    <div className="document-scroll"><p>{terms[step][1]}</p></div>
                    <div className="actions">{button(step === 46 ? 'Accept agreement' : 'Accept and next page', () => {
                        if (step < 46) setStep(s => s + 1); else {
                            update({daily: day()});
                            complete('terms');
                            setGate(null);
                            resume.current();
                        }
                    })}
                        <button ref={refusalRef} className="button secondary fleeing" tabIndex={-1} aria-disabled="true"
                                style={refusalPosition ? {
                                    position: 'fixed',
                                    left: refusalPosition.x,
                                    top: refusalPosition.y,
                                    zIndex: 150
                                } : undefined} onPointerDown={e => e.preventDefault()} onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}>I disagree
                        </button>
                        {fast && button('Presenter: accept all pages', () => {
                            update({daily: day()});
                            complete('terms');
                            setGate(null);
                            resume.current();
                        })}</div>
                </>;
            case 'privacy':
                return <><p>Reading speed: one pixel per second. {Math.floor(privacyY)} pixels acknowledged.</p>
                    <div className="document-scroll privacy-document" ref={privacyRef} onScroll={e => {
                        if (Math.abs(e.currentTarget.scrollTop - privacyY) > 1) e.currentTarget.scrollTop = privacyY;
                    }} tabIndex={0} aria-label="Privacy notice, automatically scrolling">{privacy.map(([title, text]) =>
                        <section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div>
                    {button('Acknowledge privacy notice', () => {
                        complete('privacy');
                        setGate(null);
                    }, !privacyEnd)}</>;
            case 'cookies':
                return <><p>Necessary cookies maintain alarm appointments. Optional cookies support commercial profiling
                    and service personalization.</p>
                    <div className="detail">Purpose <strong>Sleep monetization and consent accounting</strong></div>
                    {button('Accept all', () => {
                        update({cookies: true});
                        complete('cookies');
                        setGate(null);
                    })} {button('Reject all', () => {
                        update({cookies: false});
                        complete('cookies');
                        setGate(null);
                        notify('Optional cookies rejected. Silence rights revoked; revise your preferences in Settings.');
                    }, false, true)}</>;
            case 'drm':
                return <><p>WakeUp Licensing requires an active Wi-Fi connection to authorize alarm controls.</p>
                    <div className="detail">Network status <strong>{online ? 'Connected' : 'Disconnected'}</strong>
                    </div>
                    {button('Verify connection', () => {
                        update({drmUntil: Date.now() + 86400000});
                        complete('drm');
                        setGate(null);
                    }, !online)}</>;
            case 'update':
                return <>
                    <div className="detail">Wakefulness Runtime 26.10 <strong>4.7 GB</strong></div>
                    <div className="loader">
                        <div style={{width: `${Math.min(100, elapsed * 5)}%`}}/>
                    </div>
                    <p>{elapsed < 12 ? 'Downloading required components' : elapsed < 17 ? 'Verifying local package manifest' : 'Installing dismissal compatibility fixes'} · {Math.min(100, elapsed * 5)}%</p>{button('Restart authorization service', () => {
                    update({updated: true});
                    complete('update');
                    setGate(null);
                }, elapsed < 20)}</>;
            case 'sync':
                return <><p>Reconciling this operation across 17 availability regions. Changes are awaiting replica
                    confirmation.</p>
                    <div className="loader">
                        <div style={{width: `${Math.min(100, elapsed * 25)}%`}}/>
                    </div>
                    {elapsed >= 4 &&
                        <p>{step ? 'SYNC-503: Replica unavailable. Your local copy is authoritative.' : 'All local changes reconciled.'}</p>}{button('Return to workspace', () => {
                        complete('sync');
                        setGate(null);
                    }, elapsed < 4)}</>;
            case 'password-expiry':
                return <><p>Your alarm has activated, expiring your account password. Create a replacement to restore
                    account eligibility.</p><label className="field">Replacement password<input type="password"
                                                                                                value={input}
                                                                                                onChange={e => setInput(e.target.value)}
                                                                                                autoComplete="new-password"/></label>{button('Renew password', () => {
                    update({expired: false});
                    complete('password-expiry');
                    afterForm(() => open('device'));
                }, input.length < 6)}</>;
            case 'device':
                return <>
                    <div className="detail">Recognized
                        installation <strong>{state.device.slice(0, 8) || 'LOCAL'}</strong></div>
                    <p>{navigator.platform} · This is the same installation. Our policy requires a second
                        opinion.</p>{button('Confirm this device', () => {
                    complete('device');
                    open('totp');
                })}</>;
            case 'totp':
                return <><p>Submit five consecutive valid codes. Our verification infrastructure discards the first four
                    confirmations.</p>
                    <div className="code-preview" aria-label="Local authenticator code">{code}</div>
                    <label className="field">Authenticator code<input inputMode="numeric" value={input} maxLength={6}
                                                                      onChange={e => setInput(e.target.value)}/></label>
                    <p>{round} of 5 confirmed</p>{button('Verify code', () => {
                        const version = sessionVersion.current;
                        void totp().then(actual => {
                            if (version !== sessionVersion.current) return;
                            setInput('');
                            setCode(actual);
                            if (input !== actual) {
                                setRound(0);
                                notify('Invalid or expired code. Consecutive confirmations reset.');
                            } else if (round === 4) {
                                update({verifiedDay: day()});
                                complete('totp');
                                setGate(null);
                                notify('Device confirmed. Request dismissal to continue.');
                            } else {
                                setRound(r => r + 1);
                                notify('Code accepted. Confirmation discarded; please resubmit.');
                            }
                        });
                    })}</>;
            case 'premium':
                return <>
                    <div className="subscription"><h3>WakeUp Premium</h3><strong>$29.99 / month</strong><p>Extend
                        dismissal beyond {state.score < 500 ? '09:00–12:00' : '09:00–17:00'}. Advertising and statutory
                        approvals remain applicable.</p></div>
                    {button('Purchase Premium', () => purchase('premium'))}<p>Or return during your free dismissal
                    hours.</p></>;
            case 'banner':
                return <><p>The free dismissal control is below this sponsored placement.</p>
                    <div className="occluded">
                        <button className="button" disabled>Dismiss alarm</button>
                        <button className="occluder" onClick={() => {
                            complete('banner');
                            open('ads');
                        }}>WakeUp Premium · reclaim this space →
                        </button>
                    </div>
                </>;
            case 'ads':
                return <>
                    <div className="sponsored ad-creative"><span>WAKEUP BUSINESS PLATINUM · SPONSORED</span><AlarmClock
                        size={64}/><h3>Own your morning.</h3><p>Lease the silence.</p><strong>$29.99 <small>/
                        month</small></strong>
                        <div className="loader">
                            <div style={{width: `${Math.min(100, elapsed / 30 * 100)}%`}}/>
                        </div>
                    </div>
                    <p>Advertisement · {Math.max(0, 30 - elapsed)} seconds remaining</p>{button('Continue', () => {
                    complete('ads');
                    setGate(null);
                }, elapsed < 30)}</>;
            case 'queue':
                return <>
                    <div className="queue-number">{queue.toLocaleString()}</div>
                    <p>requests ahead of yours. Your position updates
                        automatically.</p>{button('Buy priority placement', () => purchase('priority'), state.completed.priority)} {button('Continue to dismissal checkout', () => purchase('dismiss'), queue > 0)}
                    <p>Need statutory clearance instead? {button('Apply for WAKE-1040', () => {
                        setCaptchaFor('paperwork');
                        open('captcha');
                    }, false, true)}</p></>;
            case 'maintenance':
                return <><p>WAC-MNT-902 · Dismissal Authorization Service is undergoing scheduled maintenance. Essential
                    alarm playback continues.</p>
                    <div className="detail">Next service
                        window <strong>{new Date(state.maintenanceUntil).toLocaleTimeString()}</strong></div>
                    {button('Retry authorization', () => {
                        complete('maintenance');
                        update({maintenanceUntil: 0});
                        setGate(null);
                    }, now < state.maintenanceUntil && !fast)}</>;
            case 'rate':
                return <>
                    <div className="error-code">429</div>
                    <p>Your sign-out request is pending the mandatory seven-day account retention period. You may sign
                        out after {new Date(state.lockedUntil).toLocaleString()}. Alarm controls remain
                        available.</p>{button('Complete sign out', signOut, now < state.lockedUntil)}{fast && button('Presenter: release sign-out hold', () => update({lockedUntil: Date.now() - 1}))}</>;
            case 'region':
                return <>
                    <div className="detail">Licensed region <strong>{state.region}</strong></div>
                    <p>REG-451: Standard snoozing is restricted in JO and GB under the Regional Wakefulness Distribution
                        Schedule. An exception may be issued for this
                        transaction.</p>{button('Purchase one-time snooze exception', () => purchase(pendingSnooze.current))}</>;
            case 'rating':
                return <><p>Your purchased snooze is pending. Complete your review before the countdown
                    begins.</p>{stars(Number(input), n => {
                    setInput(String(n));
                    if (n === 5) activateSnooze(); else notify('Ratings below five stars cannot be accepted. Please select five stars.');
                })}</>;
            case 'dlc':
                return <><p>Mute is licensed separately from dismissal. This purchase permanently unlocks the mute
                    control in this browser.</p>
                    <div className="subscription"><h3>Peace & Quiet</h3><strong>$49.99 / device</strong></div>
                    {button('Buy expansion', () => purchase('dlc'))}</>;
            case 'accessibility':
                return <><p>Accessibility requests require verification. Our identity service protects all human
                    requests.</p>{button('Begin verification', () => {
                    setCaptchaFor('accessibility');
                    open('captcha');
                })}</>;
            case 'captcha':
                return captcha && <><p>{captcha.prompt}</p>
                    <div className="captcha-grid">{captchaOrder.map(i => <button type="button" key={i}
                                                                                 aria-label={`Tile ${i + 1}: ${captcha.tiles[i]}`}
                                                                                 aria-pressed={selected.includes(i)}
                                                                                 className={selected.includes(i) ? 'chosen' : ''}
                                                                                 onClick={() => setSelected(s => s.includes(i) ? s.filter(v => v !== i) : [...s, i])}>{captcha.tiles[i]}</button>)}</div>
                    <p>{round} of 3 rounds confirmed</p>{button('Verify selection', () => {
                        const valid = selected.length === captcha.correct.length && selected.every(v => captcha.correct.includes(v));
                        setCaptcha(makeCaptcha());
                        setSelected([]);
                        if (!valid) {
                            setRound(0);
                            notify('Selection rejected. A fresh challenge has been issued.');
                        } else if (round < 2) {
                            setRound(r => r + 1);
                            notify('Human status provisionally acknowledged. Continue verification.');
                        } else {
                            complete('captcha');
                            if (captchaFor === 'accessibility') {
                                update({accessibility: true});
                                complete('accessibility');
                                setGate(null);
                            } else open('paperwork');
                        }
                    })}</>;
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
            default:
                return null;
        }

}

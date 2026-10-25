'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button } from '../ui-controls';
import { terms, privacy } from '@/lib/legal';
import { totp } from '@/lib/totp';
import { day } from '@/app/config';

export function OnboardingGates({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { gate, state, setGate, step, setStep, elapsed, fast, input, setInput, code, setCode, round, setRound, privacyY, privacyEnd, online, refusalPosition, refusalRef, sessionVersion, privacyRef, resume, update, notify, complete, open, afterForm } = app;
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
                return <><span className="eyebrow">PAGE {step + 1} OF {terms.length}</span><h3>{terms[step][0]}</h3>
                    <div className="document-scroll"><p>{terms[step][1]}</p></div>
                    <div className="actions">{button(step === terms.length - 1 ? 'Accept agreement' : 'Accept and next page', () => {
                        if (step < terms.length - 1) setStep(s => s + 1); else {
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
        default: return null;
    }
}

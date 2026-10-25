'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button, stars } from '../ui-controls';
import { AlarmClock } from 'lucide-react';

export function ServicesGates({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { gate, state, setGate, elapsed, now, fast, input, setInput, setCaptchaFor, queue, pendingSnooze, update, notify, complete, open, purchase, activateSnooze, signOut } = app;
    switch (gate) {
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
        default: return null;
    }
}

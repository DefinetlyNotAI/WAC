'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button } from '../ui-controls';
import { row } from '../ui-controls';

export function SupportPage({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { state, now, open, setCaptchaFor, ringing } = app;
    return <>
<section className="section-card"><h2>Customer
                    support</h2>{row('Subscription cancellation', 'Interactive retention assistance during sleeping hours.', button('Call support', () => open('cancel'), !state.premium, true))}{row('Dismissal paperwork', 'Form WAKE-1040 · 3–5 business days.', button('Start application', () => {
                    setCaptchaFor('paperwork');
                    open('captcha');
                }, !ringing, true))}{row('Service status', state.maintenanceUntil > now ? 'Scheduled maintenance in progress.' : 'Authorization service available.', button('View maintenance', () => open('maintenance'), false, true))}{state.paperwork &&
                    <p>Application {state.paperwork.reference} ·
                        expected {new Date(state.paperwork.due).toLocaleDateString()}</p>}</section>
    </>;
}

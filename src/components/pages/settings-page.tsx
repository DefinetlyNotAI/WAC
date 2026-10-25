'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button } from '../ui-controls';
import { row } from '../ui-controls';

export function SettingsPage({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { state, open, setTools, update } = app;
    return <>
<section className="section-card"><h2>Device and
                    account</h2>{row('Account recovery', 'Request account recovery.', button('Recover account', () => open('reset'), false, true))}{row(
                    'Regional licensing', `Current region: ${state.region}. JO and GB require snooze exceptions.`,
                    <span>Regional service policy</span>
                )}{row('Cookie preferences', state.cookies === false ? 'Optional consent rejected; silence rights revoked.' : 'Manage consent preferences.', button('Configure cookies', () => open('cookies'), false, true))}{row('Privacy notice', 'Corporate review advances at one pixel per second.', button('Read privacy policy', () => open('privacy'), false, true))}{row('Accessibility', state.accessibility ? 'Larger controls and higher contrast enabled.' : 'Visual verification required.', button(state.accessibility ? 'Disable' : 'Enable', () => state.accessibility ? update({accessibility: false}) : open('accessibility'), false, true))}
                    <p className="muted">Presenter tools:
                        Ctrl+Shift+D {button('Open presenter panel', () => setTools(true), false, true)}</p></section>
    </>;
}

'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button } from '../ui-controls';
import { money, snoozePrice } from '@/lib/rules';

export function BillingPage({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { state, exportStatement, open, purchase } = app;
    return <>

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
                
    </>;
}

'use client';
import type { useAlarmController } from './use-alarm-controller.tsx';
import { X } from 'lucide-react';
import { invoice, money } from '@/lib/rules.ts';

export function CheckoutPanel({app}: {app: ReturnType<typeof useAlarmController>}) {
    const { checkout, setCheckout, tip, setTip, decline, setDecline, pay, returnFromPayment, button } = app;
    return <>
        {checkout && <div className="overlay payment-layer">
            <section className="dialog checkout-dialog" role="dialog" aria-modal="true" aria-label="WakeUp checkout">
                <header className="dialog-header">
                    <div><span className="eyebrow">WAKEUP PAYMENTS · SECURE CHECKOUT</span>
                        <h2>{checkout.paid ? 'Payment receipt' : 'Review and pay'}</h2></div>
                    {!checkout.paid &&
                        <button className="icon-button" aria-label="Close checkout" onClick={() => setCheckout(null)}><X
                            size={18}/></button>}</header>
                <div className="dialog-content">
                    <div className="checkout-order">
                        <span>Order {checkout.id}</span><strong>{checkout.title}</strong><small>WakeUp Wallet · instant
                        account settlement</small></div>
                    {checkout.kind === 'dismiss' && !checkout.paid && <fieldset>
                        <legend>Tip your alarm</legend>
                        <div className="actions">{[0, 20, 25, 30].map(n => <button type="button" key={n}
                                                                                   className={`button ${tip === n ? '' : 'secondary'}`}
                                                                                   aria-pressed={tip === n}
                                                                                   onClick={() => setTip(n)}>{n ? `${n}%` : 'No tip'}</button>)}</div>
                    </fieldset>}
                    <div
                        className="invoice-list">{(checkout.paid || invoice(checkout.base, checkout.peak, tip)).lines.map(l =>
                        <div key={l.label}><span>{l.label}</span><strong>{money(l.cents)}</strong></div>)}
                        <div className="invoice-total">
                            <span>Total</span><strong>{money((checkout.paid || invoice(checkout.base, checkout.peak, tip)).total)}</strong>
                        </div>
                    </div>
                    {checkout.paid ? <><p>Approved · receipt saved in
                        Billing.</p>{button('Complete purchase', returnFromPayment)}</> : <><label className="field">Payment
                        method<select value={decline ? 'decline' : 'approve'}
                                      onChange={e => setDecline(e.target.value === 'decline')}>
                            <option value="approve">WakeUp Wallet</option>
                            <option value="decline">WakeUp Reserve · unavailable</option>
                        </select></label><p>Charges are deducted from your WakeUp account balance. Overdraft terms
                        apply.</p>{button(`Pay ${money(invoice(checkout.base, checkout.peak, tip).total)}`, pay)}</>}
                </div>
            </section>
        </div>}
    </>;
}

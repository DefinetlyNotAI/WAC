'use client';
import React, { useState } from 'react';
import { CreditCard, LockKeyhole, X } from 'lucide-react';
import type { useAlarmController } from './use-alarm-controller';
import { invoice, money } from '@/lib/rules';
import { formatCardExpiry, formatCardNumber, type DemoCardInput } from '@/lib/payment';
import { useModalFocus } from '@/hooks/use-modal-focus';

type App = ReturnType<typeof useAlarmController>;

const emptyCard: DemoCardInput = { holder: '', number: '', expiry: '', cvc: '', postalCode: '' };

export function CheckoutPanel({ app }: { app: App }) {
    if (!app.checkout) return null;
    // Reset local, transient card fields for each new purchase.
    return <CheckoutDialog key={app.checkout.id} app={app}/>;
}

function CheckoutDialog({ app }: { app: App }) {
    const { checkout, setCheckout, tip, setTip, pay, returnFromPayment } = app;
    const [card, setCard] = useState<DemoCardInput>(emptyCard);
    const [error, setError] = useState('');
    const dialogRef = useModalFocus(!checkout?.paid, () => setCheckout(null));
    if (!checkout) return null;

    const order = checkout.paid ?? invoice(checkout.base, checkout.peak, tip);
    const patch = (field: keyof DemoCardInput, value: string) => {
        setCard(previous => ({ ...previous, [field]: value }));
        setError('');
    };
    const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const result = pay(card);
        if (result) setError(result);
    };

    return <div className="overlay payment-layer">
        <section ref={dialogRef} tabIndex={-1} className="dialog checkout-dialog" role="dialog" aria-modal="true" aria-label="WakeUp checkout">
            <header className="dialog-header">
                <div><span className="eyebrow">WAKEUP PAYMENTS · SIMULATED CHECKOUT</span>
                    <h2>{checkout.paid ? 'Payment receipt' : 'Review and pay'}</h2></div>
                {!checkout.paid && <button type="button" className="icon-button" aria-label="Close checkout" onClick={() => setCheckout(null)}><X size={18}/></button>}
            </header>
            <div className="dialog-content">
                <div className="checkout-order"><span>Order {checkout.id}</span><strong>{checkout.title}</strong>
                    <small>Demonstration checkout · No external payment processing</small></div>
                {checkout.kind === 'dismiss' && !checkout.paid && <fieldset>
                    <legend>Tip your alarm</legend>
                    <div className="actions">{[0, 20, 25, 30].map(value => <button type="button" key={value}
                        className={`button ${tip === value ? '' : 'secondary'}`}
                        aria-pressed={tip === value} onClick={() => setTip(value)}>{value ? `${value}%` : 'No tip'}</button>)}</div>
                </fieldset>}
                <div className="invoice-list">{order.lines.map(line =>
                    <div key={line.label}><span>{line.label}</span><strong>{money(line.cents)}</strong></div>)}
                    <div className="invoice-total"><span>Total</span><strong>{money(order.total)}</strong></div>
                </div>
                {checkout.paid ? <>
                    <div className="checkout-success"><CreditCard size={20}/><div><strong>Payment approved</strong>
                        <p>{checkout.paid.paymentMethod ?? 'Demo card'} · Receipt saved in Billing</p></div></div>
                    <button type="button" className="button" onClick={returnFromPayment}>Complete purchase</button>
                </> : <form onSubmit={submit} className="demo-card-form" autoComplete="off">
                    <div className="demo-card-heading"><strong><LockKeyhole size={16}/> Demo credit or debit card</strong>
                        <span>LOCAL SIMULATION</span></div>
                    <label className="field">Cardholder name
                        <input required autoComplete="off" name="demo-cardholder" value={card.holder} maxLength={80}
                            placeholder="Jordan Miller" onChange={event => patch('holder', event.target.value)}/>
                    </label>
                    <label className="field">Card number
                        <input required autoComplete="off" name="demo-card-number" inputMode="numeric" value={card.number}
                            placeholder="4242 4242 4242 4242" maxLength={19}
                            onChange={event => patch('number', formatCardNumber(event.target.value))}/>
                    </label>
                    <div className="demo-card-grid">
                        <label className="field">Expiration (MM/YY)
                            <input required autoComplete="off" name="demo-expiry" inputMode="numeric" value={card.expiry}
                                placeholder="12/30" maxLength={5}
                                onChange={event => patch('expiry', formatCardExpiry(event.target.value))}/>
                        </label>
                        <label className="field">CVC
                            <input required autoComplete="off" name="demo-cvc" inputMode="numeric" value={card.cvc}
                                placeholder="123" maxLength={4}
                                onChange={event => patch('cvc', event.target.value.replace(/\D/g, '').slice(0, 4))}/>
                        </label>
                    </div>
                    <label className="field">Billing ZIP / postal code
                        <input required autoComplete="off" name="demo-postal" value={card.postalCode}
                            placeholder="10001" maxLength={12}
                            onChange={event => patch('postalCode', event.target.value)}/>
                    </label>
                    <div className="demo-card-examples"><strong>Test cards only</strong>
                        <p>Visa: 4242 4242 4242 4242 · Mastercard: 5555 5555 5555 4444</p>
                        <p>Declined card: 4000 0000 0000 0002 · Any future expiry, 3-digit CVC and postal code</p>
                    </div>
                    {error && <p role="alert" className="payment-error">{error}</p>}
                    <p className="muted">No actual payment occurs. Only the demo card brand and last four digits appear on the receipt. Your simulated account balance is adjusted.</p>
                    <button className="button full" type="submit">Pay {money(order.total)}</button>
                </form>}
            </div>
        </section>
    </div>;
}

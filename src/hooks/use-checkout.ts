'use client';
import { useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { Checkout, Gate, Product } from '@/app/page.types';
import type { SavedState } from '@/lib/storage';
import { invoice, snoozePrice, validGratuity } from '@/lib/rules';
import { validateDemoCard, type DemoCardInput } from '@/lib/payment';
import { setAlarmVolume } from '@/lib/audio';

type CheckoutDeps = {
    state: SavedState;
    setState: Dispatch<SetStateAction<SavedState>>;
    online: boolean;
    ringing: boolean;
    pendingSnooze: MutableRefObject<'snooze' | 'loot'>;
    paidSnooze: MutableRefObject<boolean>;
    encounter: (id: string) => void;
    open: (gate: Gate) => void;
    update: (patch: Partial<SavedState>) => void;
    notify: (message: string) => void;
    silence: () => void;
    setGate: Dispatch<SetStateAction<Gate>>;
};

/** Handles simulated checkout and persists only receipts, never entered card credentials. */
export function useCheckout({ state, setState, online, ringing, pendingSnooze, paidSnooze,
    encounter, open, update, notify, silence, setGate }: CheckoutDeps) {
    const [checkout, setCheckout] = useState<Checkout | null>(null);
    const [tip, setTip] = useState(0);
    const paying = useRef(false);

    function purchase(kind: Product) {
        const products = {
            snooze: ['Five-minute snooze', snoozePrice(state.snoozes, state.score)],
            loot: ['Random snooze crate · 0–60 seconds', 299],
            premium: ['WakeUp Premium · first month', 2999],
            dlc: ['Peace & Quiet · perpetual device license', 4999],
            priority: ['Priority dismissal placement', 999],
            dismiss: ['Alarm dismissal authorization', 99]
        } as const;
        if ((kind === 'snooze' || kind === 'loot') && !ringing) {
            notify('A snooze requires an active alarm.');
            return;
        }
        encounter('fees');
        if (kind === 'snooze') encounter('pay-snooze');
        if (kind === 'loot') encounter('lootbox');
        const hour = new Date().getHours();
        const peak = kind === 'dismiss' && hour >= 5 && hour < 9;
        if (peak) encounter('surge');
        if (kind === 'dismiss') encounter('tip');
        setCheckout({ kind, title: products[kind][0], base: products[kind][1], peak,
            id: `WAC-${crypto.randomUUID().slice(0, 8).toUpperCase()}` });
        setTip(0);
        paying.current = false;
        setGate(null);
    }

    /** Returns an error for the form, or undefined on successful approval. */
    function pay(card: DemoCardInput): string | undefined {
        if (!checkout || checkout.paid || paying.current) return 'This transaction has already been processed.';
        if (checkout.kind === 'dismiss' && !online) {
            setCheckout(null);
            open('drm');
            return 'Payment requires local licensing authorization.';
        }
        if (checkout.kind === 'dismiss' && !validGratuity(tip)) {
            return 'Gratuity rejected. The minimum service appreciation is 30%.';
        }
        const verification = validateDemoCard(card);
        if (!verification.ok) return verification.error;
        if (verification.declined) return 'PAY-402: The demo bank declined this card. Try the approved test card.';

        paying.current = true;
        const receipt = {
            ...invoice(checkout.base, checkout.peak, tip),
            id: checkout.id,
            title: checkout.title,
            at: Date.now(),
            paymentMethod: `Demo ${verification.brand} •••• ${verification.lastFour}`
        };
        const kind = checkout.kind;
        setState(current => ({
            ...current,
            balance: current.balance - receipt.total,
            receipts: [receipt, ...current.receipts],
            premium: current.premium || kind === 'premium',
            dlc: current.dlc || kind === 'dlc',
            pendingSnooze: kind === 'snooze' || kind === 'loot' ? kind : current.pendingSnooze,
            completed: { ...current.completed, [kind]: true }
        }));
        setCheckout({ ...checkout, paid: receipt });
        if (kind === 'dismiss') silence();
        if (kind === 'dlc') update({ volume: 0 });
        if (kind === 'snooze' || kind === 'loot') {
            pendingSnooze.current = kind;
            paidSnooze.current = true;
        }
        return undefined;
    }

    function returnFromPayment() {
        if (!checkout?.paid) return;
        const kind = checkout.kind;
        setCheckout(null);
        if (kind === 'dismiss') notify('Your dismissal receipt is available in Billing.');
        else if (kind === 'snooze' || kind === 'loot') open('rating');
        else if (kind === 'priority') open('queue');
        else if (kind === 'dlc') {
            update({ volume: 0 });
            setAlarmVolume(0);
            notify('Peace & Quiet installed. Output muted.');
        } else notify('Premium activated. Request dismissal to continue.');
    }

    function resetCheckout() {
        setCheckout(null);
        setTip(0);
        paying.current = false;
    }

    return { checkout, setCheckout, tip, setTip, purchase, pay, returnFromPayment, resetCheckout };
}

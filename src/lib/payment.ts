/** Demo-only payment instruments. No payment provider or network request is involved. */
export type DemoCardInput = {
    holder: string;
    number: string;
    expiry: string;
    cvc: string;
    postalCode: string;
};

type CardDefinition = { brand: string; status: 'approved' | 'declined' };

const DEMO_CARDS: Record<string, CardDefinition> = {
    '4242424242424242': { brand: 'Visa', status: 'approved' },
    '5555555555554444': { brand: 'Mastercard', status: 'approved' },
    '4000000000000002': { brand: 'Visa', status: 'declined' },
};

export const formatCardNumber = (value: string): string =>
    value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

export function formatCardExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export type CardValidation =
    | { ok: true; brand: string; lastFour: string; declined: boolean }
    | { ok: false; error: string };

export function validateDemoCard(card: DemoCardInput, now = new Date()): CardValidation {
    const digits = card.number.replace(/\s/g, '');
    const testCard = DEMO_CARDS[digits];
    if (!testCard) return { ok: false, error: 'Use one of the demo card numbers listed below. Real cards are not accepted.' };
    if (card.holder.trim().length < 2) return { ok: false, error: 'Enter a name on the demo card.' };

    const expiry = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(card.expiry);
    if (!expiry) return { ok: false, error: 'Enter an expiration date as MM/YY.' };
    const year = 2000 + Number(expiry[2]);
    const month = Number(expiry[1]);
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        return { ok: false, error: 'This demo card has expired.' };
    }
    if (!/^\d{3,4}$/.test(card.cvc)) return { ok: false, error: 'Enter a 3 or 4 digit demo security code.' };
    if (!/^[a-z\d][a-z\d -]{2,11}$/i.test(card.postalCode.trim())) {
        return { ok: false, error: 'Enter a valid ZIP or postal code.' };
    }
    return { ok: true, brand: testCard.brand, lastFour: digits.slice(-4), declined: testCard.status === 'declined' };
}

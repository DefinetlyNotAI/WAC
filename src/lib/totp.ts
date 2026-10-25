
/* Types */

type TotpConfig = {
    secret: string;
    timestamp: number;
};

/* Constants */

const DEFAULT_SECRET = 'WakeUpEnterpriseLocalDemo';

const TOTP_INTERVAL = 30_000;
const TOTP_DIGITS = 6;
const TOTP_MODULUS = 10 ** TOTP_DIGITS;

const HMAC_ALGORITHM = {
    name: 'HMAC',
    hash: 'SHA-1',
} as const;

/* Internal Helpers */

function getCrypto(): SubtleCrypto {
    if (!globalThis.crypto?.subtle) {
        throw new Error(
            'Local authenticator requires a secure localhost context.',
        );
    }

    return globalThis.crypto.subtle;
}

async function importSecret(
    subtle: SubtleCrypto,
    secret: string,
): Promise<CryptoKey> {
    const encoded = new TextEncoder().encode(secret);

    return subtle.importKey(
        'raw',
        encoded,
        HMAC_ALGORITHM,
        false,
        ['sign'],
    );
}

function createCounter(timestamp: number): Uint8Array<ArrayBuffer> {
    const count = Math.floor(timestamp / TOTP_INTERVAL);
    const counter = new Uint8Array(8);
    const view = new DataView(counter.buffer);

    view.setUint32(4, count, false);

    return counter;
}

function truncateDigest(digest: Uint8Array): number {
    const offset = digest[digest.length - 1] & 0x0f;

    const value =
        ((digest[offset] & 0x7f) << 24)
        | (digest[offset + 1] << 16)
        | (digest[offset + 2] << 8)
        | digest[offset + 3];

    return value % TOTP_MODULUS;
}

function formatCode(value: number): string {
    return String(value).padStart(TOTP_DIGITS, '0');
}

/* Public Functions */

export async function totp(
    secret: TotpConfig['secret'] = DEFAULT_SECRET,
    timestamp: TotpConfig['timestamp'] = Date.now(),
): Promise<string> {
    const subtle = getCrypto();

    const key = await importSecret(subtle, secret);
    const counter = createCounter(timestamp);

    const signature = await subtle.sign(
        'HMAC',
        key,
        counter,
    );

    const digest = new Uint8Array(signature);
    const value = truncateDigest(digest);

    return formatCode(value);
}

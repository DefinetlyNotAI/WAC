import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/* Runtime */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Types */

type NetworkStatus = {
    connected: boolean | null;
};

/* Constants */

const execFileAsync = promisify(execFile);
const RESPONSE_HEADERS = { 'Cache-Control': 'no-store' };
const WIFI_CONNECTED_PATTERN = /^\s*State\s*:\s*connected\s*$/im;
const NETWORK_TIMEOUT_MS = 2500;

/* Internal Helpers */

function response(connected: NetworkStatus['connected']): Response {
    return Response.json({ connected }, { headers: RESPONSE_HEADERS });
}

async function isWifiConnected(): Promise<boolean> {
    const { stdout } = await execFileAsync(
        'netsh.exe',
        ['wlan', 'show', 'interfaces'],
        { windowsHide: true, timeout: NETWORK_TIMEOUT_MS },
    );

    return WIFI_CONNECTED_PATTERN.test(stdout);
}

/* Route Handler */

export async function GET(): Promise<Response> {
    if (process.platform !== 'win32') {
        return response(null);
    }

    try {
        return response(await isWifiConnected());
    } catch {
        return response(false);
    }
}

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const run = promisify(execFile);

export async function GET() {
  if (process.platform !== 'win32') return Response.json({ connected: null }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const { stdout } = await run('netsh.exe', ['wlan', 'show', 'interfaces'], { windowsHide: true, timeout: 2500 });
    return Response.json({ connected: /^\s*State\s*:\s*connected\s*$/im.test(stdout) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ connected: false }, { headers: { 'Cache-Control': 'no-store' } }); }
}

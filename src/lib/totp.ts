// Demo-only local HMAC TOTP, no authentication provider or remote API.
export async function totp(secret = 'WakeUpEnterpriseLocalDemo', timestamp = Date.now()): Promise<string> {
  if (!globalThis.crypto?.subtle) return '000000';
  const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const count = Math.floor(timestamp / 30000); const counter = new Uint8Array(8);
  const view = new DataView(counter.buffer); view.setUint32(4,count,false);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC',key,counter)); const offset=digest[digest.length-1]&15;
  const value = (((digest[offset]&127)<<24)|(digest[offset+1]<<16)|(digest[offset+2]<<8)|digest[offset+3])%1000000;
  return String(value).padStart(6,'0');
}

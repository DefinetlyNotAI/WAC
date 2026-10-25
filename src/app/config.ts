import { Bell, CircleHelp, CreditCard, Settings2, ShieldCheck } from 'lucide-react';
import type { Gate } from './page.types';

export const day = () => new Date().toDateString();
export const nav = [{key: 'alarms', label: 'Alarms', icon: Bell}, {
    key: 'billing',
    label: 'Billing',
    icon: CreditCard
}, {key: 'rewards', label: 'Rewards', icon: ShieldCheck}, {
    key: 'settings',
    label: 'Settings',
    icon: Settings2
}, {key: 'support', label: 'Support', icon: CircleHelp}] as const;
export const titles: Record<NonNullable<Gate>, string> = {
    startup: 'Preparing your workspace',
    onboarding: 'Morning product orientation',
    terms: 'Service agreement',
    privacy: 'Privacy acknowledgment',
    cookies: 'Cookie control center',
    drm: 'License authorization',
    update: 'Required runtime update',
    sync: 'Cloud reconciliation',
    device: 'Verify this device',
    'password-expiry': 'Your password has expired',
    totp: 'Five-round identity verification',
    captcha: 'Human verification',
    paperwork: 'Application for dismissal',
    region: 'Regional snooze license',
    premium: 'Extended dismissal hours',
    banner: 'Your free dismissal control',
    ads: 'A message from our partners',
    queue: 'Dismissal authorization queue',
    maintenance: 'Scheduled maintenance',
    rate: 'Sign-out request pending',
    rating: 'Please rate our app',
    dlc: 'Peace & Quiet Expansion',
    accessibility: 'Accessibility verification',
    cancel: 'Cancellation assistance',
    reset: 'Account recovery',
    survey: 'Required service feedback',
};

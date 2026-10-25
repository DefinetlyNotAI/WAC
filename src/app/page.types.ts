import type { Receipt } from '@/lib/storage';

export type Page = 'alarms' | 'billing' | 'rewards' | 'settings' | 'support';
export type Gate =
    'startup'
    | 'onboarding'
    | 'terms'
    | 'privacy'
    | 'cookies'
    | 'drm'
    | 'update'
    | 'sync'
    | 'device'
    | 'password-expiry'
    | 'totp'
    | 'captcha'
    | 'paperwork'
    | 'region'
    | 'premium'
    | 'banner'
    | 'ads'
    | 'queue'
    | 'maintenance'
    | 'rate'
    | 'rating'
    | 'dlc'
    | 'accessibility'
    | 'cancel'
    | 'reset'
    | 'survey'
    | null;
export type Product = 'snooze' | 'loot' | 'premium' | 'dlc' | 'priority' | 'dismiss';
export type Checkout = { kind: Product; title: string; base: number; peak: boolean; id: string; paid?: Receipt };

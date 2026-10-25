'use client';
import type { useAlarmController } from './use-alarm-controller';
import { OnboardingGates } from './gates/onboarding-gates';
import { ServicesGates } from './gates/services-gates';
import { VerificationGates } from './gates/verification-gates';
import { SupportGates } from './gates/support-gates';

export function GateContent({ app }: { app: ReturnType<typeof useAlarmController> }) {
    switch (app.gate) {
        case 'startup':
        case 'onboarding':
        case 'terms':
        case 'privacy':
        case 'cookies':
        case 'drm':
        case 'update':
        case 'sync':
        case 'password-expiry':
        case 'device':
        case 'totp':
            return <OnboardingGates app={app}/>;
        case 'premium':
        case 'banner':
        case 'ads':
        case 'queue':
        case 'maintenance':
        case 'rate':
        case 'region':
        case 'rating':
        case 'dlc':
        case 'accessibility':
            return <ServicesGates app={app}/>;
        case 'captcha':
            return <VerificationGates app={app}/>;
        case 'survey':
        case 'paperwork':
        case 'cancel':
        case 'reset':
            return <SupportGates app={app}/>;
        default: return null;
    }
}

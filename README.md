# WakeUp™ Enterprise

A satirical, intentionally hostile alarm clock with **37 local-only mechanics**, simulated bureaucracy, itemized fictional bills, and a separate presenter panel.

## Requirements

- Node.js 22.18+ and npm, installed locally
- A current Chromium/Firefox/Edge browser

## Run on Windows / PowerShell

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:3000 . No deployment, accounts, internet or external services are required **at runtime**. `npm install` retrieves the open-source framework packages once. To run without any network at all, you'll need to pre-download or vendor those npm packages. The Next.js development server is bound to the loopback address, not exposed publicly.

## Usage

- **Alarms**: Create, edit, enable, disable, or delete daily alarms. Active alarms offer dismissal and paid snoozing.
- **Billing**: Purchase Premium, inspect itemized receipts, and export a local statement. All amounts are fictional.
- **Rewards**: Earn XP through alarm activity, collect one daily reward, and unlock sound selection at level 30.
- **Settings / Support**: Manage consent, accessibility verification, privacy review, cancellation calls, and WAKE-1040 applications.
- **Presenter controls**: Press **Ctrl+Shift+D**, or open the panel from Settings. Trigger alarms and individual features, accelerate timers, set region/credit/XP/Premium, inspect state, and reset the workspace. Automatic interaction surveys remain disabled.

Browser storage (`localStorage`) holds alarms, snooze deadlines, entitlements, receipts, credit, debt, daily acknowledgments, and encounter history. Existing v1 balances and enabled alarms migrate on first load. The app starts logged out on each page load; this synthetic login does not erase persisted progress. No actual payment, third-party API, email, or live connectivity check is used.

## Alarm limitations

Click **Enable sound** once after opening the browser to satisfy autoplay restrictions. Alarms catch up from their persisted deadlines on refresh, but browsers can suspend background timers and cannot reliably ring after the browser closes or a device sleeps. Keep the local server running, browser open, and device awake. Use **Trigger alarm now** in the presenter panel for demonstrations.

## Checks

Use Node.js 22.18+ (native TypeScript support) for `npm test`. The focused regression checks cover pricing, invoices, dismissal hours, scheduling, debt, business days, randomized CAPTCHA answers, and a standard TOTP vector. Run `npm run lint` for TypeScript checking and `npm run build` for the production build.

## Privacy

Everything, including simulated usernames, bills, account paradoxes, 2FA and error messages, is local. Simulated authentication is a joke, not real access control. Any account names in demonstrations are synthetic.

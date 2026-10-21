# WakeUp™ Enterprise

A satirical, intentionally hostile alarm clock with **37 local-only mechanics**, a feature lab, simulated bureaucracy, fake bills, and a hackathon showcase mode.

## Requirements

- Node.js 22+ and npm, installed locally
- A current Chromium/Firefox/Edge browser

## Run on Windows / PowerShell

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:3000 . No deployment, accounts, internet or external services are required **at runtime**. `npm install` retrieves the open-source framework packages once. To run without any network at all, you'll need to pre-download or vendor those npm packages. The Next.js development server is bound to the loopback address, not exposed publicly.

## Usage

- **Dashboard**: Set an alarm, run a test alarm, interact with intentional obstacles.
- **Feature Lab**: Select any of the 37 features to demonstrate its local behavior; toggle them on and off.
- **Showcase**: Launch a curated demo journey, or jump directly to a specific interaction.
- **Account & Finance**: View fictional invoices, balance, debt, XP, and credit score.
- **Reset**: Restore all local state to default.

Browser storage (`localStorage`) holds all application state. A database is **not necessary** for a single-device single-browser hackathon demo, so Drizzle ORM is intentionally omitted. If cross-browser or multi-process persistence becomes necessary, add Drizzle ORM with SQLite later. No actual payment is possible. No genuine third-party APIs, email, data transmission, or live web checks are used. Network adapter checks use `navigator.onLine`, which is only a browser hint and never blocks core functionality.

## Alarm limitations

The sound alarm works while its browser tab is open and the browser allows audio playback. Click the **Arm audio** button once to satisfy browser autoplay restrictions. This is not a native background alarm service. Browsers can suspend background timers and cannot reliably ring after the browser closes or a device sleeps. Use the **Test alarm** button for predictable presentations.

## Privacy

Everything, including simulated usernames, bills, account paradoxes, 2FA and error messages, is local. Simulated authentication is a joke, not real access control. Any account names in demonstrations are synthetic.

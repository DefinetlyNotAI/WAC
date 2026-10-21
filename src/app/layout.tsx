import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "WakeUp™ Enterprise | Worst Alarm Clock", description: "37 reasons to regret waking up. Entirely local satirical alarm app." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }

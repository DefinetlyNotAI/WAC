import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "WakeUp™ Enterprise",
    description: "Enterprise alarm management and wakefulness services."
};
export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
    return <html lang="en">
    <body>{children}</body>
    </html>;
}

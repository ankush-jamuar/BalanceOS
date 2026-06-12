import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/Providers";
import "./globals.css";

/* ─── Font Definitions ───────────────────────────────────────────────────────
   Three-font system:
   - Inter:             All UI text, body copy, labels, inputs
   - Instrument Serif:  Landing page display headlines only
   - JetBrains Mono:    All financial numbers, amounts, timestamps, data
────────────────────────────────────────────────────────────────────────────── */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false, // Only used on landing page, lazy load
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "BalanceOS — Precision Expense Sharing",
  description:
    "A precision-engineered collaborative expense workspace. Track live ledger balances, compute splits, and resolve debts transparently with your team.",
  keywords: ["expense sharing", "group payments", "split bills", "debt settlement", "collaborative finance"],
  openGraph: {
    title: "BalanceOS — Precision Expense Sharing",
    description: "A precision-engineered collaborative expense workspace.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className="dark"
        style={{ colorScheme: "dark" }}
        suppressHydrationWarning
      >
        <body
          className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}

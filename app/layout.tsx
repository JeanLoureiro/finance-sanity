import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
  preload: true,
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
  preload: false,
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://financialsanity.app"),
  title: "Financial Sanity",
  description: "Personal wealth tracker",
  openGraph: {
    title: "Financial Sanity",
    description: "Personal wealth tracker",
    url: "https://financialsanity.app",
    siteName: "Financial Sanity",
    images: ["/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Financial Sanity",
    description: "Personal wealth tracker",
    images: ["/icon-512.png"],
  },
  other: {
    'fetchpriority': 'high',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full w-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

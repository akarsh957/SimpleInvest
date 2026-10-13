import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SimpleInvest — Wealth Management Platform',
  description: 'Institutional-grade portfolio analytics, live market intelligence, and AI-powered equity research for modern investors.',
  keywords: 'investing, portfolio, stocks, wealth management, equity research, AI screener',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="h-full bg-[#121418] text-[#E8ECF4] font-sans antialiased selection:bg-[#00D09C]/20 selection:text-[#00D09C]">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SimpleInvest — Financial Intelligence Terminal',
  description: 'High-density institutional financial analytics, live portfolio risk diagnostics, and momentum screening.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable} h-full dark`}>
      <body className="h-full bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-zinc-800 selection:text-zinc-100">
        {children}
      </body>
    </html>
  );
}


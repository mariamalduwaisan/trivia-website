import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'How I Met Your Mother — Trivia Challenge',
  description: "MacLaren's Pub Edition — test your HIMYM knowledge!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

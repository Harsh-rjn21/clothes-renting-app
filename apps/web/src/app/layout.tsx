import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StyleRent | Premium Designer Wear Rental",
  description: "Rent premium designer wear for any occasion. Access the world's finest garments without the price tag.",
};

import VerificationGuard from '@/components/VerificationGuard';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body
        className="antialiased min-h-screen bg-background text-foreground font-sans selection:bg-indigo-100 selection:text-indigo-900"
        suppressHydrationWarning
      >
        <VerificationGuard>
          {children}
        </VerificationGuard>
      </body>
    </html>
  );
}

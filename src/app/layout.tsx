import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AARANYA — Hand-set diamonds & 22K gold",
  description: "Hand-set diamonds and 22K gold, composed by our atelier in Jaipur.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} bg-cream text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
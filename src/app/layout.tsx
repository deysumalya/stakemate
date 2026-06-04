import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stakemate — Commit to your goals or lose ₹20",
  description:
    "India's #1 AI-powered productivity platform. Pledge money on your study goals, get challenged by AI, and prove your work. Built for JEE, NEET, coding & language learners.",
  keywords: [
    "productivity",
    "JEE preparation",
    "NEET preparation",
    "study commitment",
    "AI study app",
    "accountability platform",
    "Indian students",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StageSync",
  description: "Live karaoke queueing for singers, bands, and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex min-h-full flex-1 flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-200 bg-white/90 px-4 py-6 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-400 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
              <p>StageSync</p>
              <nav className="flex items-center gap-4">
                <Link href="/terms" className="font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                  Terms / Terms of Service
                </Link>
                <Link href="/privacy" className="font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/support" className="font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                  Support
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

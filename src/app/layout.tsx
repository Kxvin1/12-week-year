import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "The 12-Week Year",
  description: "Gamified Habit and Performance Tracker",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* Body uses the global background/text color from globals.css */}
      <body className="bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col">
        <header className="bg-gray-800 text-white px-6 py-3 flex items-center justify-center fixed top-0 w-full z-50">
          <nav className="flex gap-4">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/setup-goals" className="hover:underline">
              Setup Goals
            </Link>
            <Link href="/daily" className="hover:underline">
              Daily Tasks
            </Link>
            <Link href="/weekly-summary" className="hover:underline">
              Weekly Summary
            </Link>
          </nav>
        </header>

        <main className="flex-grow flex justify-center mt-8 pt-4">
          <div className="w-full max-w-4xl px-4">{children}</div>
        </main>

        <footer className="text-center py-4 text-sm text-gray-500">
          © 2025 The 12-Week Year
        </footer>
      </body>
    </html>
  );
}

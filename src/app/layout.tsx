// ----- FILE: src/app/layout.tsx -----
import "./globals.css"; // Assuming this is your Tailwind/global setup
import Link from "next/link";
import type { Metadata } from "next";
import { ReactNode } from "react";

// You can set some metadata if you want, or omit this entirely
export const metadata: Metadata = {
  title: "12-Week Scoreboard",
  description: "Track your daily tasks and weekly progress!",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* Body uses the global background/text color from globals.css */}
      <body className="bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col">
        {/* NAVIGATION BAR - persistent on every page */}
        <header className="bg-gray-800 text-white px-6 py-3 flex items-center justify-center">
          <nav className="flex gap-4">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/setup-goals" className="hover:underline">
              Setup Goals
            </Link>
            <Link href="/daily" className="hover:underline">
              Daily View
            </Link>
            <Link href="/weekly-summary" className="hover:underline">
              Weekly Summary
            </Link>
            <Link href="/overview" className="hover:underline">
              Overview
            </Link>
          </nav>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow flex justify-center mt-8">
          {/* 
            We wrap the children in a container to limit width, 
            then add some padding.
          */}
          <div className="w-full max-w-3xl px-4">{children}</div>
        </main>

        {/* FOOTER (optional) */}
        <footer className="text-center py-4 text-sm text-gray-500">
          © 2025 12-Week Scoreboard
        </footer>
      </body>
    </html>
  );
}

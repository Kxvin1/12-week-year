"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGoals } from "@/utils/localStorage";
import { Goal } from "@/utils/types";

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  // Potentially track current week's partial score:
  const [currentWeekNumber, setCurrentWeekNumber] = useState(3); // example
  const [currentWeekScore, setCurrentWeekScore] = useState<number | null>(null);

  useEffect(() => {
    // Load goals from localStorage
    setGoals(getGoals());
    // If needed, compute current week's partial score from daily entries
    // setCurrentWeekScore(??) once you have logic
  }, []);

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">12-Week Scoreboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">
          Current Week: #{currentWeekNumber} | Score So Far:{" "}
          {currentWeekScore !== null ? `${currentWeekScore}%` : "XX%"}
        </h2>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Overarching Goals (short list)
        </h2>
        <ol className="list-decimal list-inside">
          {goals.map((goal, index) => (
            <li key={goal.id} className="mb-1">
              {goal.title}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Quick Links</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/setup-goals" className="text-blue-600 underline">
            Setup Goals
          </Link>
          <Link href="/daily" className="text-blue-600 underline">
            Daily View
          </Link>
          <Link href="/weekly-summary" className="text-blue-600 underline">
            Weekly Summary
          </Link>
          <Link href="/overview" className="text-blue-600 underline">
            Overview
          </Link>
        </nav>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGoals } from "@/utils/localStorage";
import { Goal } from "@/utils/types";

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  // Potentially track current week's partial score

  useEffect(() => {
    // Load goals from localStorage
    setGoals(getGoals());
    // If needed, compute current week's partial score from daily entries
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">12-Week Scoreboard</h1>
      <section className="mb-6">
        <h2 className="text-xl">Current Week: #TODO</h2>
        <p>Score So Far: TODO</p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl">Overarching Goals</h2>
        <ul>
          {goals.map((goal) => (
            <li key={goal.id}>{goal.title}</li>
          ))}
        </ul>
      </section>
      <nav className="flex gap-4 mt-6">
        <Link href="/setup-goals">Setup Goals</Link>
        <Link href="/daily">Daily View</Link>
        <Link href="/weekly-summary">Weekly Summary</Link>
        <Link href="/overview">Overview</Link>
      </nav>
    </main>
  );
}

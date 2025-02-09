"use client";

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
    <div className="py-4">
      <h1 className="text-3xl font-bold mb-6">12-Week Scoreboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">
          Current Week: #{currentWeekNumber} | Score So Far:{" "}
          {currentWeekScore !== null
            ? `${currentWeekScore}%`
            : "N/A - complete a week to see score."}
        </h2>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Overarching Goals (12 Week Goals)
        </h2>
        <ol className="list-decimal list-inside">
          {goals.map((goal, index) => (
            <li key={goal.id} className="mb-1">
              {goal.title}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

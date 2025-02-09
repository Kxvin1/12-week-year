"use client";

import { useEffect, useState } from "react";
import { getGoals, getDailyEntries } from "@/utils/localStorage";
import { Goal, DailyEntry } from "@/utils/types";

/**
 * 1) Determine the current week based on how many unique days exist.
 *    0 days => Week 1
 *    1-7 days => Week 1
 *    8-14 days => Week 2, etc.
 */
function determineCurrentWeekNumber(dailyEntries: DailyEntry[]): number {
  if (dailyEntries.length === 0) return 1;
  const uniqueDays = new Set(dailyEntries.map((d) => d.date));
  const countDays = uniqueDays.size;
  const weekNum = Math.floor((countDays - 1) / 7) + 1;
  return weekNum < 1 ? 1 : weekNum;
}

/**
 * 2) Calculate a partial score for the "current week" by scanning
 *    only the days that fall into that 7-day window.
 *
 *    For consistency with the rest of the app, let's define a base Monday
 *    date for "Week 1" (2025-02-03) and compute date ranges from there.
 */
const baseMondayDate = new Date("2025-02-03T08:00:00.000Z");
function getDateRangeForWeek(weekNumber: number) {
  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
  const startDate = new Date(
    baseMondayDate.getTime() + (weekNumber - 1) * oneWeekInMs
  );
  const endDate = new Date(startDate.getTime() + oneWeekInMs - 1);

  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];
  return { start, end };
}

function dateStringToNumber(dateStr: string) {
  return parseInt(dateStr.replace(/-/g, ""), 10);
}

/** Convert daily tasks to a 0-100 score. */
function calculateWeeklyScore(dailyEntries: DailyEntry[]): number | null {
  let total = 0;
  let count = 0;

  dailyEntries.forEach((entry) => {
    entry.tasks.forEach((task) => {
      switch (task.tier) {
        case "S":
          total += 4;
          break;
        case "A":
          total += 3;
          break;
        case "B":
          total += 2;
          break;
        case "C":
          total += 1;
          break;
      }
      count++;
    });
  });
  if (count === 0) return null;

  const average = total / count; // 0–4
  const percentage = (average / 4) * 100;
  return Math.round(percentage);
}

/**
 * Filter dailyEntries for the given week number
 * and compute a partial score.
 */
function computeCurrentWeekScore(
  dailyEntries: DailyEntry[],
  currentWeekNumber: number
): number | null {
  const { start, end } = getDateRangeForWeek(currentWeekNumber);
  const startNum = dateStringToNumber(start);
  const endNum = dateStringToNumber(end);

  const filtered = dailyEntries.filter((entry) => {
    const entryNum = dateStringToNumber(entry.date);
    return entryNum >= startNum && entryNum <= endNum;
  });

  return calculateWeeklyScore(filtered);
}

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(3);
  const [currentWeekScore, setCurrentWeekScore] = useState<number | null>(null);

  useEffect(() => {
    // Load goals
    setGoals(getGoals());

    // Load daily entries
    const dailyEntries = getDailyEntries();

    // 1) Figure out which week we're on, based on total unique days
    const week = determineCurrentWeekNumber(dailyEntries);
    setCurrentWeekNumber(week);

    // 2) Compute partial score for that week from the date range
    const partial = computeCurrentWeekScore(dailyEntries, week);
    setCurrentWeekScore(partial);
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
          {goals.map((goal) => (
            <li key={goal.id} className="mb-1">
              {goal.title}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

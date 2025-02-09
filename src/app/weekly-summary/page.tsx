"use client";

import { useState, useEffect } from "react";
import {
  getDailyEntries,
  getWeeklySummaries,
  saveWeeklySummary,
} from "@/utils/localStorage";
import { WeeklySummary, DailyEntry } from "@/utils/types";

/**
 * Helper function to determine the date range for a given "week number".
 * This can vary depending on how you define "week #1" start date.
 * For this example, let's assume week #1 starts on some fixed date,
 * or you let the user pick a "start date" externally.
 * Adjust logic as needed.
 */
function getDateRangeForWeek(weekNumber: number) {
  // Example: let's say week #1 started on 2025-02-05.
  // Each week is 7 days. So:
  const startOfFirstWeek = new Date("2025-02-05");

  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
  const startDate = new Date(
    startOfFirstWeek.getTime() + (weekNumber - 1) * oneWeekInMs
  );
  const endDate = new Date(startDate.getTime() + oneWeekInMs - 1); // 7 days later, minus 1 ms

  // Format them as YYYY-MM-DD for easier comparison with your daily entries
  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];
  return { start, end };
}

/**
 * Convert a date string 'YYYY-MM-DD' into a comparable numeric (e.g., 20250205).
 * Helpful for comparisons.
 */
function dateStringToNumber(dateStr: string) {
  return parseInt(dateStr.replace(/-/g, ""), 10);
}

/**
 * Calculate the score for a given array of daily entries.
 * For each DailyTask: S=4, A=3, B=2, C=1.
 * Then we average them or sum them up.
 * For simplicity, let's do an average (0-4).
 */
function calculateWeeklyScore(dailyEntries: DailyEntry[]) {
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
      count += 1;
    });
  });

  if (count === 0) return 0; // No tasks, no score

  // For a percentage or 0-4 scale, you can choose.
  // Let's do "percent" with 4 being 100%, so 4 => 100%, 3 => 75%, etc.
  const average = total / count; // 0 to 4
  const percentage = (average / 4) * 100; // 0 to 100
  return Math.round(percentage);
}

export default function WeeklySummaryPage() {
  const [weekNumber, setWeekNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [reflection, setReflection] = useState("");
  const [existingSummary, setExistingSummary] = useState<WeeklySummary | null>(
    null
  );

  useEffect(() => {
    // Whenever weekNumber changes, recalc the date range & compute the score
    const { start, end } = getDateRangeForWeek(weekNumber);

    const entries = getDailyEntries();
    // Filter daily entries that fall within [start, end]
    const startNum = dateStringToNumber(start);
    const endNum = dateStringToNumber(end);

    const filteredEntries = entries.filter((entry) => {
      const entryNum = dateStringToNumber(entry.date);
      return entryNum >= startNum && entryNum <= endNum;
    });

    // Calculate score
    const newScore = calculateWeeklyScore(filteredEntries);
    setScore(newScore);

    // Check if we already have a saved WeeklySummary for this week
    const summaries = getWeeklySummaries();
    const found = summaries.find((s) => s.weekNumber === weekNumber);
    if (found) {
      setExistingSummary(found);
      setReflection(found.reflection || "");
    } else {
      setExistingSummary(null);
      setReflection("");
    }
  }, [weekNumber]);

  function handleSave() {
    const newSummary: WeeklySummary = {
      weekNumber,
      score,
      reflection,
    };
    saveWeeklySummary(newSummary);
    alert("Weekly summary saved!");
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">Weekly Summary</h1>

      {/* Week Number Selector (1 to 12, for example) */}
      <div className="mb-4">
        <label className="mr-2">Week Number:</label>
        <select
          value={weekNumber}
          onChange={(e) => setWeekNumber(parseInt(e.target.value, 10))}
          className="border p-2"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-4">
        Computed Score: <strong>{score}%</strong> (0 - 100%)
      </p>

      <div className="mb-4">
        <label className="block mb-2">Reflection:</label>
        <textarea
          className="border p-2 w-full"
          rows={5}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
        />
      </div>

      <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2">
        Save Weekly Summary
      </button>

      {existingSummary && (
        <p className="mt-4 text-green-600">
          Loaded an existing summary for Week #{existingSummary.weekNumber}.
        </p>
      )}
    </main>
  );
}

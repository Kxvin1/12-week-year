"use client";

import { useState, useEffect } from "react";
import {
  getDailyEntries,
  getWeeklySummaries,
  saveWeeklySummary,
} from "@/utils/localStorage";
import { WeeklySummary, DailyEntry } from "@/utils/types";

/**
 * Dynamically read the "baseMonday" from localStorage,
 * or default to 2025-02-03 if not set.
 * This matches the logic used in HomePage so Week #1
 * lines up with the user's chosen Monday.
 */
function getBaseMondayDate(): Date {
  const stored =
    typeof window !== "undefined"
      ? window.localStorage.getItem("baseMonday")
      : null;

  if (stored) {
    return new Date(`${stored}T08:00:00.000Z`);
  } else {
    return new Date("2025-02-03T08:00:00.000Z");
  }
}

/**
 * Return the date range (start, end) for a given weekNumber
 * using the dynamic baseMondayDate from localStorage.
 */
function getDateRangeForWeek(weekNumber: number) {
  const baseMondayDate = getBaseMondayDate();
  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

  const startDate = new Date(
    baseMondayDate.getTime() + (weekNumber - 1) * oneWeekInMs
  );
  const endDate = new Date(startDate.getTime() + oneWeekInMs - 1);

  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];
  return { start, end };
}

/** Convert "YYYY-MM-DD" => number for date comparisons */
function dateStringToNumber(dateStr: string) {
  return parseInt(dateStr.replace(/-/g, ""), 10);
}

/**
 * Compute a dynamic score (S/A/B/C) for the given week by scanning daily tasks
 * in that 7-day date range, ignoring any "score" in WeeklySummary itself.
 */
function calculateWeekScore(
  weekNumber: number,
  allDaily: DailyEntry[]
): number {
  const { start, end } = getDateRangeForWeek(weekNumber);
  const startNum = dateStringToNumber(start);
  const endNum = dateStringToNumber(end);

  let total = 0;
  let count = 0;

  const filtered = allDaily.filter((entry) => {
    const entryNum = dateStringToNumber(entry.date);
    return entryNum >= startNum && entryNum <= endNum;
  });

  filtered.forEach((entry) => {
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

  if (count === 0) return 0;
  const average = total / count;
  const percentage = (average / 4) * 100;
  return Math.round(percentage);
}

/**
 * Same logic as in Home page: figure out how many total unique days
 * have been completed to figure out the "current" week.
 * For example:
 * - 0 daily entries => week 1
 * - 1-7 daily entries => week 1
 * - 8-14 => week 2, etc.
 */
function determineCurrentWeekNumber(dailyEntries: DailyEntry[]): number {
  if (dailyEntries.length === 0) return 1;
  const uniqueDays = new Set(dailyEntries.map((d) => d.date));
  const countDays = uniqueDays.size;
  // e.g. 1-7 => week 1, 8-14 => week 2, etc.
  const weekNum = Math.floor((countDays - 1) / 7) + 1;
  return weekNum < 1 ? 1 : weekNum;
}

export default function WeeklySummaryPage() {
  // Instead of always defaulting to "1", we can do a "lazy" approach
  // and set it to 1 for now, then update once we load daily data
  const [weekNumber, setWeekNumber] = useState<number>(1);

  const [score, setScore] = useState(0);
  const [reflection, setReflection] = useState("");
  const [reflectionEditMode, setReflectionEditMode] = useState(false);

  const [existingSummary, setExistingSummary] = useState<WeeklySummary | null>(
    null
  );

  // Track all daily entries, weekly summaries
  const [allDaily, setAllDaily] = useState<DailyEntry[]>([]);
  const [allSummaries, setAllSummaries] = useState<WeeklySummary[]>([]);

  // We'll store the date range for the current weekNumber (for display)
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");

  // On mount, load daily + weekly data from localStorage
  useEffect(() => {
    const daily = getDailyEntries();
    setAllDaily(daily);

    const sums = getWeeklySummaries().sort(
      (a, b) => a.weekNumber - b.weekNumber
    );
    setAllSummaries(sums);

    // Once we have daily data, compute the "current" week
    const currentWeek = determineCurrentWeekNumber(daily);
    setWeekNumber(currentWeek);
  }, []);

  // Re-run each time weekNumber or data changes
  useEffect(() => {
    if (allDaily.length === 0 && allSummaries.length === 0) return;

    // 1) figure out date range (start, end) for the chosen week
    const { start, end } = getDateRangeForWeek(weekNumber);
    setWeekStart(start);
    setWeekEnd(end);

    // 2) compute dynamic weekly score
    const newScore = calculateWeekScore(weekNumber, allDaily);
    setScore(newScore);

    // 3) see if there's an existing weekly summary in localStorage
    const found = allSummaries.find((s) => s.weekNumber === weekNumber);
    if (found) {
      setExistingSummary(found);
      setReflection(found.reflection || "");
    } else {
      setExistingSummary(null);
      setReflection("");
    }

    setReflectionEditMode(false);
  }, [weekNumber, allDaily, allSummaries]);

  /**
   * For saving the summary.
   * Show a confirm if reflection is empty & there's a real score > 0
   * (meaning the user actually has tasks).
   */
  function handleSave() {
    // If there are tasks (score>0) but reflection is empty => prompt user
    if (score > 0 && !reflection.trim()) {
      const confirmed = confirm(
        "Your reflection is empty, but you have tasks for this week. Are you sure you want to finalize without adding a reflection?"
      );
      if (!confirmed) return;
    }

    const newSummary: WeeklySummary = {
      weekNumber,
      score,
      reflection,
    };
    saveWeeklySummary(newSummary);

    // Update local array
    const updated = [...allSummaries];
    const idx = updated.findIndex((s) => s.weekNumber === weekNumber);
    if (idx >= 0) updated[idx] = newSummary;
    else updated.push(newSummary);

    updated.sort((a, b) => a.weekNumber - b.weekNumber);
    setAllSummaries(updated);

    setExistingSummary(newSummary);
    setReflectionEditMode(false);
    alert("Weekly summary saved!");
  }

  // Decide if we show the "warning" about reflection
  // Only show if there's tasks in this week => score>0
  // AND no existing summary => i.e. this week not saved
  const showReflectionWarning = score > 0 && !existingSummary;

  return (
    <>
      {/* Gradient Hero */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-400 py-12 text-center text-white rounded-lg">
        <h1 className="text-4xl font-bold mb-2">Weekly Summary</h1>
        <p className="max-w-xl mx-auto text-lg">
          Check your weekly summary and which dates the current week covers.
        </p>
      </div>

      {/* White card */}
      <div className="max-w-5xl mx-auto -mt-10 pb-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Week Selector */}
          <div className="flex items-center gap-4 mb-6 justify-center">
            <label className="font-semibold text-gray-700">
              Select Week:{" "}
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value, 10))}
                className="border p-2 rounded ml-2 text-gray-800"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Week {num}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="text-center mb-4 text-gray-800">
            {/* Show date range for the current week */}
            <p className="text-lg font-medium">
              Week #{weekNumber} covers:{" "}
              <span className="text-blue-600 font-semibold">
                {weekStart} - {weekEnd}
              </span>
            </p>

            <p className="text-xl mt-3">
              Computed Score: <strong>{score}%</strong>
            </p>
          </div>

          {showReflectionWarning && (
            <p className="text-red-600 font-medium mb-4 text-center">
              You have tasks this week but no reflection is saved! Add a
              reflection to finalize this week.
            </p>
          )}

          <div className="max-w-2xl mx-auto text-gray-800 mb-6">
            {reflectionEditMode ? (
              <>
                <label className="font-semibold mb-2 block text-green-800">
                  Reflection (Editing):
                </label>
                <textarea
                  className="border p-2 w-full rounded"
                  rows={4}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </>
            ) : (
              <>
                <label className="font-semibold mb-2 block text-gray-700">
                  Reflection (Read-Only):
                </label>
                <div className="bg-gray-200 p-3 rounded min-h-[80px]">
                  {reflection
                    ? reflection
                    : "No reflection yet. Click 'Edit Reflection' to add notes for this week."}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {reflectionEditMode ? (
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Weekly Summary
              </button>
            ) : (
              <button
                onClick={() => setReflectionEditMode(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Edit Reflection
              </button>
            )}
          </div>

          {existingSummary && !reflectionEditMode && (
            <p className="mb-6 text-green-600 text-center">
              Loaded existing summary for Week #{existingSummary.weekNumber}.
            </p>
          )}

          {/* Table of all completed weeks */}
          <div className="mt-8 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-2 text-center text-gray-800">
              Previously Completed Weeks
            </h2>
            {allSummaries.length === 0 ? (
              <p className="text-center text-gray-600">
                No weekly summaries yet.
              </p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-300 text-gray-800">
                    <th className="border p-2">Week #</th>
                    <th className="border p-2">Score (%)</th>
                    <th className="border p-2">Reflection</th>
                  </tr>
                </thead>
                <tbody>
                  {allSummaries.map((ws) => {
                    const dynamicScore = calculateWeekScore(
                      ws.weekNumber,
                      allDaily
                    );
                    return (
                      <tr
                        key={ws.weekNumber}
                        className="bg-gray-100 text-center text-gray-800"
                      >
                        <td className="border p-2">{ws.weekNumber}</td>
                        <td className="border p-2">{dynamicScore}%</td>
                        <td className="border p-2 text-left">
                          {ws.reflection || "No reflection"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

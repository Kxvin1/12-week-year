"use client";

import { useState, useEffect } from "react";
import {
  getDailyEntries,
  getWeeklySummaries,
  saveWeeklySummary,
} from "@/utils/localStorage";
import { WeeklySummary, DailyEntry } from "@/utils/types";
import {
  getDateRangeForWeek,
  computeWeekScore,
  determineCurrentWeekNumber,
} from "@/utils/weeksAndScores";

/**
 * Return the date range (start, end) for a given weekNumber
 * using the dynamic baseMondayDate from localStorage.
 */

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
    const newScore = computeWeekScore(weekNumber, allDaily);
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
          Check weekly summaries and which dates the selected week covers.
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

            {score ? (
              <p className="text-xl mt-3">
                Computed Score: <strong>{score}%</strong>
              </p>
            ) : (
              ""
            )}
          </div>

          {showReflectionWarning && (
            <p className="text-red-600 font-bold mb-4 text-center">
              You have tasks this week but no weekly summary is saved! Edit and
              Save if you want to finalize this week. <br />
              Clicking &apos;Cancel Editing&apos; preserves your entry but does
              not save.
            </p>
          )}

          <div className="max-w-2xl mx-auto text-gray-800 mb-6">
            {reflectionEditMode ? (
              <>
                <label className="font-semibold mb-2 block text-green-800">
                  Weekly Summary (Editing):
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
                  Weekly Summary (Read-Only):
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
              <>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Save Weekly Summary
                </button>
                <button
                  onClick={() => setReflectionEditMode(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  Cancel Editing
                </button>
              </>
            ) : (
              <button
                onClick={() => setReflectionEditMode(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Edit Weekly Summary
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
                    const dynamicScore = computeWeekScore(
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

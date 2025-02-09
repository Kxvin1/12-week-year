"use client";

import { useEffect, useState } from "react";
import {
  getGoals,
  getDailyEntries,
  getWeeklySummaries,
  getWeeklySummaries as fetchWeeklySummaries,
  saveGoals,
  saveDailyEntries,
  saveWeeklySummaries,
} from "@/utils/localStorage";
import { Goal, DailyEntry, WeeklySummary } from "@/utils/types";

/**
 * Determine the current week number based on total unique days
 */
function determineCurrentWeekNumber(dailyEntries: DailyEntry[]): number {
  if (dailyEntries.length === 0) return 1;
  const uniqueDays = new Set(dailyEntries.map((d) => d.date));
  const countDays = uniqueDays.size;
  const weekNum = Math.floor((countDays - 1) / 7) + 1;
  return weekNum < 1 ? 1 : weekNum;
}

/**
 * For partial score, we define a base Monday date and
 * compute the daily tasks for that current 7-day window.
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
  const average = total / count; // 0-4
  const percentage = (average / 4) * 100;
  return Math.round(percentage);
}

/**
 * Compute a partial score for the "current" week
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

/**
 * For the table, compute dynamic week scores for each saved WeeklySummary
 */
function computeWeekScore(weekNumber: number, allDaily: DailyEntry[]): number {
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
  const average = total / count; // 0–4
  const percentage = (average / 4) * 100;
  return Math.round(percentage);
}

/** Export/Import logic from the old Overview. */
function exportData() {
  const data = {
    goals: getGoals(),
    dailyEntries: getDailyEntries(),
    weeklySummaries: fetchWeeklySummaries(),
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "12-week-scoreboard-data.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const result = e?.target?.result;
      if (!result) return;
      const parsed = JSON.parse(result as string);

      if (parsed.goals) saveGoals(parsed.goals);
      if (parsed.dailyEntries) saveDailyEntries(parsed.dailyEntries);
      if (parsed.weeklySummaries) saveWeeklySummaries(parsed.weeklySummaries);

      alert("Data imported successfully! Please refresh the page.");
    } catch (err) {
      alert("Error importing data. Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(3);
  const [currentWeekScore, setCurrentWeekScore] = useState<number | null>(null);

  // For the "merged overview" table & average
  const [allSummaries, setAllSummaries] = useState<WeeklySummary[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [overallAverage, setOverallAverage] = useState<number>(0);

  useEffect(() => {
    // Load goals
    setGoals(getGoals());

    // Load daily
    const daily = getDailyEntries();
    setDailyEntries(daily);

    // Weekly Summaries
    const summaries = getWeeklySummaries().sort(
      (a, b) => a.weekNumber - b.weekNumber
    );
    setAllSummaries(summaries);

    // Which week are we on?
    const week = determineCurrentWeekNumber(daily);
    setCurrentWeekNumber(week);

    // partial
    const partial = computeCurrentWeekScore(daily, week);
    setCurrentWeekScore(partial);
  }, []);

  // Recompute overall average each time dailyEntries or allSummaries change
  useEffect(() => {
    if (allSummaries.length === 0) {
      setOverallAverage(0);
      return;
    }
    let totalScore = 0;
    let count = 0;
    allSummaries.forEach((s) => {
      const dynamicScore = computeWeekScore(s.weekNumber, dailyEntries);
      totalScore += dynamicScore;
      count++;
    });
    if (count === 0) setOverallAverage(0);
    else setOverallAverage(Math.round(totalScore / count));
  }, [allSummaries, dailyEntries]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
    }
  }

  return (
    <div className="py-4">
      <h1 className="text-3xl font-bold mb-6">12-Week Scoreboard</h1>

      {/* Current Week + Partial Score */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold">
          Current Week: #{currentWeekNumber} | Score So Far:{" "}
          {currentWeekScore !== null
            ? `${currentWeekScore}%`
            : "N/A - complete a week to see score."}
        </h2>
      </section>

      {/* Overarching Goals */}
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

      {/* Combined Overview Table + Overall Average */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">All Weeks Overview</h2>
        {allSummaries.length === 0 ? (
          <p>No weekly summaries found yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-800">
                <th className="border p-2">Week #</th>
                <th className="border p-2">Score (%)</th>
                <th className="border p-2">Reflection</th>
              </tr>
            </thead>
            <tbody>
              {allSummaries.map((summary) => {
                const dynamicScore = computeWeekScore(
                  summary.weekNumber,
                  dailyEntries
                );
                return (
                  <tr key={summary.weekNumber}>
                    <td className="border p-2 text-center">
                      {summary.weekNumber}
                    </td>
                    <td className="border p-2 text-center">{dynamicScore}</td>
                    <td className="border p-2">{summary.reflection}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <p className="mt-4">
          <strong>Overall Average Score:</strong> {overallAverage}%
        </p>
      </section>

      {/* Import/Export */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Import / Export Data</h2>
        <div className="mt-2 flex items-center gap-4">
          <button
            onClick={exportData}
            className="bg-blue-600 text-white px-4 py-2"
          >
            Export Data
          </button>
          <label className="block">
            Import Data:
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="ml-2"
            />
          </label>
        </div>
      </section>
    </div>
  );
}

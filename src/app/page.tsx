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

/* -------------- DYNAMIC MONDAY STORAGE -------------- */
function getStoredMondayDate(): Date {
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

function storeMondayDate(isoDateStr: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("baseMonday", isoDateStr);
  }
}

function getBaseMondayDate(): Date {
  return getStoredMondayDate();
}

/* -------------- LOGIC FOR WEEKS & SCORES -------------- */
function determineCurrentWeekNumber(dailyEntries: DailyEntry[]): number {
  if (dailyEntries.length === 0) return 1;
  const uniqueDays = new Set(dailyEntries.map((day) => day.date));
  const countDays = uniqueDays.size;
  const weekNum = Math.floor((countDays - 1) / 7) + 1;
  return weekNum < 1 ? 1 : weekNum;
}

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
  const average = total / count; // 0–4
  const percentage = (average / 4) * 100;
  return Math.round(percentage);
}

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
  const average = total / count;
  const percentage = (average / 4) * 100;
  return Math.round(percentage);
}

/* -------------- IMPORT / EXPORT -------------- */
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
      alert(`Error importing data. Invalid JSON file. Console Error: ${err}`);
    }
  };
  reader.readAsText(file);
}

/* -------------- CLEAR ALL DATA -------------- */
function clearAllData() {
  if (confirm("Are you sure you want to DELETE ALL your data?")) {
    localStorage.clear();
    alert("All data has been cleared. The page will now refresh.");
    window.location.reload();
  }
}

/* -------------- TIME HELPER -------------- */
/**
 * Format the current time as:
 * 12:50 A.M. | March 07 2025
 *
 * We'll update this every second via setInterval.
 */
function formatTime(date: Date): string {
  // 1) Hours in 12h format + A.M. / P.M.
  let hours = date.getHours();
  const ampm = hours >= 12 ? "P.M." : "A.M.";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  // 2) Minutes and seconds with leading zeros
  const minutes = date.getMinutes();
  const secs = date.getSeconds();
  const mm = minutes < 10 ? `0${minutes}` : minutes;
  const ss = secs < 10 ? `0${secs}` : secs;

  // 3) e.g. 12:05:09 A.M. or 1:50:22 P.M.
  const timePart = `${hours}:${mm}:${ss} ${ampm}`;

  // 4) Month name (long), day, year
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const datePart = date.toLocaleDateString("en-US", options);

  // final: "12:50 A.M. | March 07, 2025"
  return `${timePart} | ${datePart}`;
}

/* -------------- MAIN COMPONENT -------------- */
export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(3);
  const [currentWeekScore, setCurrentWeekScore] = useState<number | null>(null);
  const [allSummaries, setAllSummaries] = useState<WeeklySummary[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [overallAverage, setOverallAverage] = useState<number>(0);

  // The user-chosen Monday date
  const [chosenMonday, setChosenMonday] = useState<string>("2025-02-03");

  // State + interval for live clock
  const [currentTime, setCurrentTime] = useState<string>("");

  /* On initial load, read from localStorage + build everything. */
  useEffect(() => {
    const stored = localStorage.getItem("baseMonday");
    if (stored) setChosenMonday(stored);

    setGoals(getGoals());
    const daily = getDailyEntries();
    setDailyEntries(daily);

    const summaries = getWeeklySummaries().sort(
      (a, b) => a.weekNumber - b.weekNumber
    );
    setAllSummaries(summaries);

    const week = determineCurrentWeekNumber(daily);
    setCurrentWeekNumber(week);

    const partial = computeCurrentWeekScore(daily, week);
    setCurrentWeekScore(partial);
  }, []);

  /* Recompute overall average each time dailyEntries or allSummaries changes */
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

  /* Live clock: update every second */
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 1000);

    // Immediately set the time once on mount
    setCurrentTime(formatTime(new Date()));

    // Clean up interval
    return () => clearInterval(intervalId);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
    }
  }

  function handleMondayChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.value; // e.g. "2025-01-06"
    const day = new Date(`${selected}T00:00:00`).getUTCDay();
    // Sunday=0, Monday=1, etc.

    if (day !== 1) {
      alert("Please pick a Monday date!");
      e.target.value = chosenMonday; // revert
      return;
    }

    setChosenMonday(selected);
    storeMondayDate(selected);
    window.location.reload();
  }

  return (
    <>
      {/* Gradient "Hero" Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-400 py-16 px-4 text-white text-center rounded-t-lg">
        <h1 className="text-5xl font-bold mb-4">The 12-Week Year</h1>
        <p className="max-w-2xl mx-auto text-2xl">
          Gamified Habit and Performance Tracker
        </p>
        <p className="max-w-2xl mx-auto text-lg">
          Track your goals, daily tasks, and weekly progress in one place.
        </p>
      </div>
      {/* Current Time & Date Display */}
      <div className="bg-slate-700 text-center p-4 text-lg font-semibold text-green-400 rounded-b-lg">
        {/* Example: "12:50 A.M. | March 07, 2025" */}
        {currentTime}
        <span className="text-sm ml-4">PST (UTC/GMT-8)</span>
      </div>

      {/* Main Content Card */}
      <div className="max-w-5xl mx-auto pb-8 px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-8 mt-4">
          {/* Monday Picker */}
          <section className="border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Choose Your Start Monday
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              This determines Week #1. You can pick any month in the calendar
              UI, but only Mondays are allowed.
            </p>
            <input
              type="date"
              value={chosenMonday}
              onChange={handleMondayChange}
              className="border p-2 rounded text-gray-800"
            />
          </section>

          {/* Current Week */}
          <section className="border-b pb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Current Week: #{currentWeekNumber}
            </h2>
            <p className="text-gray-700 mt-2">
              Score So Far:{" "}
              {currentWeekScore !== null ? `${currentWeekScore}%` : "N/A"}
            </p>
          </section>

          {/* Goals */}
          <section className="border-b pb-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Long Term 12-Week Goals
            </h2>
            {goals.length === 0 ? (
              <p className="text-gray-600">
                You haven&apos;t added any 12-week goals yet.
              </p>
            ) : (
              <ol className="list-decimal list-inside text-gray-700 space-y-1">
                {goals.map((goal) => (
                  <li key={goal.id}>{goal.title}</li>
                ))}
              </ol>
            )}
          </section>

          {/* All Weeks Overview */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              All Weeks Overview
            </h2>
            {allSummaries.length === 0 ? (
              <p className="text-gray-600">No weekly summaries found yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-800">
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
                        <td className="border p-2 text-center text-gray-800">
                          {summary.weekNumber}
                        </td>
                        <td className="border p-2 text-center text-gray-800">
                          {dynamicScore}
                        </td>
                        <td className="border p-2 text-gray-800">
                          {summary.reflection}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {overallAverage ? (
              <p className="mt-4 text-gray-700">
                <strong>Overall Average Score:</strong> {overallAverage}%
              </p>
            ) : (
              ""
            )}
          </section>

          {/* Import/Export + CLEAR DATA */}
          <section className="pt-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Import / Export - JSON Only
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={exportData}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Export Data
              </button>
              <label className="flex items-center gap-2 text-gray-700">
                Import File:
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="border p-1 rounded text-gray-800"
                />
              </label>
            </div>

            <h2 className="text-sm font-semibold text-red-600 mb-2 mt-8">
              <strong>NOTE:</strong> This data is saved on your browser&apos;s
              local storage.
              <br />
              Your data will persist as long as you don&apos;t clear your
              browser data.
            </h2>

            <div className="mt-12 flex justify-center">
              <button
                onClick={clearAllData}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                CLEAR ALL DATA
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

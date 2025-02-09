"use client";

import { useEffect, useState } from "react";
import {
  getWeeklySummaries,
  getGoals,
  getDailyEntries,
  getWeeklySummaries as fetchWeeklySummaries,
  saveGoals,
  saveDailyEntries,
  saveWeeklySummaries,
} from "@/utils/localStorage";
import { WeeklySummary, DailyEntry } from "@/utils/types";

/**
 * Export function (similar to what we described before).
 */
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

// Utility to compute a dynamic score for a given weekNumber
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

export default function OverviewPage() {
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);

  useEffect(() => {
    // Load weekly summaries & daily
    const allSummaries = getWeeklySummaries();
    // Sort by weekNumber
    allSummaries.sort((a, b) => a.weekNumber - b.weekNumber);
    setSummaries(allSummaries);

    const allDaily = getDailyEntries();
    setDailyEntries(allDaily);
  }, []);

  // Compute overall average from the dynamic scores
  let totalScore = 0;
  let count = 0;
  summaries.forEach((s) => {
    const dynamicScore = computeWeekScore(s.weekNumber, dailyEntries);
    totalScore += dynamicScore;
    count++;
  });
  const averageScore = count === 0 ? 0 : Math.round(totalScore / count);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">12-Week Overview</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-gray-800">
            <th className="border p-2">Week #</th>
            <th className="border p-2">Score (%)</th>
            <th className="border p-2">Reflection</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((summary) => {
            // compute dynamic score each time
            const dynamicScore = computeWeekScore(
              summary.weekNumber,
              dailyEntries
            );
            return (
              <tr key={summary.weekNumber}>
                <td className="border p-2 text-center">{summary.weekNumber}</td>
                <td className="border p-2 text-center">{dynamicScore}</td>
                <td className="border p-2">{summary.reflection}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-4">
        <strong>Overall Average Score:</strong> {averageScore}%
      </p>

      <div className="mt-6 flex items-center gap-4">
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
    </main>
  );
}

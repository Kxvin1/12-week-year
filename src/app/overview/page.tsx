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
import { WeeklySummary } from "@/utils/types";

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

export default function OverviewPage() {
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);

  useEffect(() => {
    const all = getWeeklySummaries();
    // Sort by weekNumber just in case
    all.sort((a, b) => a.weekNumber - b.weekNumber);
    setSummaries(all);
  }, []);

  // Calculate an overall average (0 to 100) from the available summaries
  const totalScore = summaries.reduce((acc, s) => acc + s.score, 0);
  const averageScore =
    summaries.length === 0 ? 0 : Math.round(totalScore / summaries.length);

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
          {summaries.map((summary) => (
            <tr key={summary.weekNumber}>
              <td className="border p-2 text-center">{summary.weekNumber}</td>
              <td className="border p-2 text-center">{summary.score}</td>
              <td className="border p-2">{summary.reflection}</td>
            </tr>
          ))}
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

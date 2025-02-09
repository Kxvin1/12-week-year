// ----- FILE: src/app/weekly-summary/page.tsx -----
"use client";

import { useState, useEffect } from "react";
import {
  getDailyEntries,
  getWeeklySummaries,
  saveWeeklySummary,
} from "@/utils/localStorage";
import { WeeklySummary, DailyEntry } from "@/utils/types";

// We'll keep your base Monday date logic from before, or adjust as needed
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

  if (count === 0) return 0;
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
  const [reflectionEditMode, setReflectionEditMode] = useState(false);

  useEffect(() => {
    const { start, end } = getDateRangeForWeek(weekNumber);
    const entries = getDailyEntries();

    const startNum = dateStringToNumber(start);
    const endNum = dateStringToNumber(end);

    const filteredEntries = entries.filter((entry) => {
      const entryNum = dateStringToNumber(entry.date);
      return entryNum >= startNum && entryNum <= endNum;
    });

    const newScore = calculateWeeklyScore(filteredEntries);
    setScore(newScore);

    const summaries = getWeeklySummaries();
    const found = summaries.find((s) => s.weekNumber === weekNumber);
    if (found) {
      setExistingSummary(found);
      setReflection(found.reflection || "");
    } else {
      setExistingSummary(null);
      setReflection("");
    }
    setReflectionEditMode(false);
  }, [weekNumber]);

  function handleSave() {
    const newSummary: WeeklySummary = {
      weekNumber,
      score,
      reflection,
    };
    saveWeeklySummary(newSummary);
    alert("Weekly summary saved!");
    setExistingSummary(newSummary);
    setReflectionEditMode(false);
  }

  return (
    <div className="py-4">
      <h1 className="text-3xl font-bold mb-6">Weekly Summary</h1>

      <div className="mb-4 flex items-center gap-2">
        <label className="mr-2 font-semibold">Week Number:</label>
        <select
          value={weekNumber}
          onChange={(e) => setWeekNumber(parseInt(e.target.value, 10))}
          className="border p-2 rounded text-gray-800"
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

      {/* Reflection Edit/Read Mode */}
      {reflectionEditMode ? (
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Reflection (Editing):
          </label>
          <textarea
            className="border p-2 w-full rounded text-gray-800"
            rows={5}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Reflection:</label>
          <div className="border p-2 w-full bg-gray-100 rounded min-h-[100px] text-gray-800">
            {reflection
              ? reflection
              : "No reflection yet. Click 'Edit Reflection' to add one."}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        {reflectionEditMode ? (
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Weekly Summary
          </button>
        ) : (
          <button
            onClick={() => setReflectionEditMode(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Edit Reflection
          </button>
        )}
      </div>

      {existingSummary && !reflectionEditMode && (
        <p className="mt-4 text-green-600">
          Loaded existing summary for Week #{existingSummary.weekNumber}.
        </p>
      )}
    </div>
  );
}

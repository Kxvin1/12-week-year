"use client";

import { useState, useEffect } from "react";
import {
  getDailyEntries,
  getWeeklySummaries,
  saveWeeklySummary,
} from "@/utils/localStorage";
import { WeeklySummary, DailyEntry } from "@/utils/types";

// Same base Monday reference as the rest of the app:
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
      count++;
    });
  });
  if (count === 0) return 0;
  const average = total / count;
  const percentage = (average / 4) * 100;
  return Math.round(percentage);
}

export default function WeeklySummaryPage() {
  const [weekNumber, setWeekNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [reflection, setReflection] = useState("");
  const [reflectionEditMode, setReflectionEditMode] = useState(false);

  // If there's an existing summary in localStorage
  const [existingSummary, setExistingSummary] = useState<WeeklySummary | null>(
    null
  );

  useEffect(() => {
    // Recompute whenever weekNumber changes
    const dailyEntries = getDailyEntries();

    // Filter daily entries for the chosen week
    const { start, end } = getDateRangeForWeek(weekNumber);
    const startNum = dateStringToNumber(start);
    const endNum = dateStringToNumber(end);

    const filtered = dailyEntries.filter((entry) => {
      const entryNum = dateStringToNumber(entry.date);
      return entryNum >= startNum && entryNum <= endNum;
    });

    const computed = calculateWeeklyScore(filtered);
    setScore(computed);

    // See if we already have a WeeklySummary for this week
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
    // Save reflection + computed score
    const newSummary: WeeklySummary = {
      weekNumber,
      score,
      reflection,
    };
    saveWeeklySummary(newSummary);
    setExistingSummary(newSummary);
    setReflectionEditMode(false);
    alert("Weekly summary saved!");
  }

  return (
    <div className="py-4">
      <h1 className="text-3xl font-bold mb-6 flex justify-center">
        Weekly Summary
      </h1>

      <div className="flex items-center gap-4 mb-6 justify-center">
        <label className="font-semibold">
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

      <div className="flex justify-center mb-4">
        <p className="text-xl">
          Computed Score for Week #{weekNumber}: <strong>{score}%</strong>
        </p>
      </div>

      {/* Reflection Section */}
      <div className="max-w-2xl mx-auto text-gray-800 mb-6">
        {reflectionEditMode ? (
          <>
            <label className="font-semibold mb-2 block">
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
            <label className="font-semibold mb-2 block text-white">
              Reflection (Read-Only Mode):
            </label>
            <div className="bg-gray-200 p-3 rounded min-h-[80px]">
              {reflection
                ? reflection
                : "No reflection yet. Click 'Edit Reflection' to add one."}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center gap-4">
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
        <p className="mt-4 text-green-600 text-center">
          Loaded existing summary for Week #{existingSummary.weekNumber}.
        </p>
      )}
    </div>
  );
}

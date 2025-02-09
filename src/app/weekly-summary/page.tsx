"use client";

import { useState, useEffect } from "react";
import {
  getDailyEntries,
  getWeeklySummaries,
  saveWeeklySummary,
} from "@/utils/localStorage";
import { WeeklySummary, DailyEntry } from "@/utils/types";

// Base Monday date for week #1
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

function calculateWeekScore(weekNumber: number, allDaily: DailyEntry[]) {
  // Filter daily entries for the chosen weekNumber
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

  if (count === 0) return 0; // no tasks => 0
  const average = total / count;
  const percentage = (average / 4) * 100;
  return Math.round(percentage);
}

export default function WeeklySummaryPage() {
  const [weekNumber, setWeekNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [reflection, setReflection] = useState("");
  const [reflectionEditMode, setReflectionEditMode] = useState(false);

  const [existingSummary, setExistingSummary] = useState<WeeklySummary | null>(
    null
  );

  // We'll also track all daily entries for dynamic score
  const [allDaily, setAllDaily] = useState<DailyEntry[]>([]);
  const [allSummaries, setAllSummaries] = useState<WeeklySummary[]>([]);

  useEffect(() => {
    const daily = getDailyEntries();
    setAllDaily(daily);

    const summ = getWeeklySummaries().sort(
      (a, b) => a.weekNumber - b.weekNumber
    );
    setAllSummaries(summ);
  }, []);

  // Whenever weekNumber changes or data changes, recalc
  useEffect(() => {
    if (allDaily.length === 0 && allSummaries.length === 0) return;

    const computed = calculateWeekScore(weekNumber, allDaily);
    setScore(computed);

    // see if there's an existing summary with reflection
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

  function handleSave() {
    // Save reflection + computed score
    const newSummary: WeeklySummary = {
      weekNumber,
      score,
      reflection,
    };
    saveWeeklySummary(newSummary);

    // Update local copy
    const updated = [...allSummaries];
    const idx = updated.findIndex((s) => s.weekNumber === weekNumber);
    if (idx >= 0) updated[idx] = newSummary;
    else updated.push(newSummary);

    // re-sort
    updated.sort((a, b) => a.weekNumber - b.weekNumber);
    setAllSummaries(updated);

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
            <label className="font-semibold mb-2 block text-white">
              Reflection (Read-Only):
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

      {/* Table of all completed weeks - dynamic scoring & reflections */}
      <div className="mt-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-2 text-center">
          Previously Completed Weeks
        </h2>
        {allSummaries.length === 0 ? (
          <p className="text-center">No weekly summaries yet.</p>
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
  );
}

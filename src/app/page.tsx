"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getGoals,
  getDailyEntries,
  getWeeklySummaries,
} from "@/utils/localStorage";
import { Goal, DailyEntry, WeeklySummary } from "@/utils/types";
import { storeMondayDate } from "@/utils/mondayHelperFunctions";
import {
  determineCurrentWeekNumber,
  computeCurrentWeekScore,
  computeWeekScore,
} from "@/utils/weeksAndScores";
import { exportData, importData, clearAllData } from "@/utils/dataImportExport";

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
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number | null>(3);
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
    allSummaries.forEach((summary) => {
      const dynamicScore = computeWeekScore(summary.weekNumber, dailyEntries);
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
      // Find the nearest Monday
      const selectedDate = new Date(selected);
      const dayOffset = day === 0 ? -6 : 1 - day; // Adjust for Sunday
      const nearestMonday = new Date(
        selectedDate.setDate(selectedDate.getDate() + dayOffset)
      );
      const nearestMondayStr = nearestMonday.toISOString().split("T")[0];

      alert(`Please pick a Monday date! Nearest Monday: ${nearestMondayStr}`);
      e.target.value = nearestMondayStr; // Set to nearest Monday
      setChosenMonday(nearestMondayStr);
      storeMondayDate(nearestMondayStr);
    } else {
      setChosenMonday(selected);
      storeMondayDate(selected);
    }

    window.location.reload();
  }

  return (
    <>
      {/* Gradient "Hero" Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-400 py-16 px-4 text-white text-center rounded-t-lg">
        <h1 className="text-5xl font-bold mb-4">The 12-Week Year</h1>
        <p className="max-w-2xl mx-auto text-2xl">
          Achieve More in 12 Weeks Than Most Do in a Year
        </p>
        <p className="max-w-2xl mx-auto text-lg">
          Gamified Habit & Performance Tracking for Maximum Efficiency
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
          {/* Onboarding Instructions */}
          <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Quick Start Guide
            </h2>
            <p className="text-gray-700 mb-4">
              Follow these simple steps to make the most out of your 12-week
              journey:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>
                <strong>Pick a Start Monday:</strong> Select the first Monday of
                your 12-week journey below.
              </li>
              <li>
                <strong>
                  <Link href="/setup-goals" className="text-blue-600 underline">
                    Setup Goals:
                  </Link>
                </strong>{" "}
                Define what you want to achieve over the next 12 weeks.
              </li>
              <li>
                <strong>
                  <Link href="/daily" className="text-blue-600 underline">
                    Setup Daily Tasks:
                  </Link>
                </strong>{" "}
                These will persist each day, so treat them as habits.
                <ul className="list-disc list-inside ml-6">
                  <li>
                    <strong>Task Updates:</strong> Once you&apos;ve completed a
                    week - if you edit or delete a task the changes will carry
                    over to the next day for consistency.
                  </li>
                </ul>
              </li>
              <li>
                <strong>
                  <Link
                    href="/weekly-summary"
                    className="text-blue-600 underline"
                  >
                    Weekly Reflection:
                  </Link>
                </strong>{" "}
                After a full week (Monday–Sunday), visit the Weekly Summary page
                to review your progress and write a reflection (treat this as a
                weekly summary of how you think you performed that week) to save
                your progress.
              </li>
              <li>
                <strong>Repeat for the Next Weeks:</strong> Continue setting
                goals and tracking progress for each new week.
              </li>
            </ol>
          </div>
          {/* Monday Picker */}
          <section className="border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Choose Your Start Monday
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              This determines Week #1. You can pick any month in the calendar
              UI, but only Mondays are allowed.
            </p>
            {/* ADDED LABEL + ID FOR ACCESSIBILITY */}
            <label htmlFor="baseMonday" className="sr-only">
              Choose Your Start Monday
            </label>
            <input
              id="baseMonday"
              type="date"
              value={chosenMonday}
              onChange={handleMondayChange}
              className="border p-2 rounded text-gray-800"
              aria-label="Choose Your Start Monday"
              /* 'sr-only' label + this aria-label ensures screen readers 
                 & testing-library can match on "Choose Your Start Monday". */
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

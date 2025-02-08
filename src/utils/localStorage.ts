"use client";

import { Goal, DailyEntry, WeeklySummary } from "./types";

/* ----------------- localStorage Keys ----------------- */
const GOALS_KEY = "goals";
const DAILY_ENTRIES_KEY = "dailyEntries";
const WEEKLY_SUMMARIES_KEY = "weeklySummaries";

/* ----------------- GOALS ----------------- */
export function getGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  const data = window.localStorage.getItem(GOALS_KEY);
  return data ? (JSON.parse(data) as Goal[]) : [];
}

export function saveGoals(goals: Goal[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

/* --------------- DAILY ENTRIES --------------- */
export function getDailyEntries(): DailyEntry[] {
  if (typeof window === "undefined") return [];
  const data = window.localStorage.getItem(DAILY_ENTRIES_KEY);
  return data ? (JSON.parse(data) as DailyEntry[]) : [];
}

export function saveDailyEntries(entries: DailyEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_ENTRIES_KEY, JSON.stringify(entries));
}

/**
 * Utility to add or update a single day's entry.
 **/

export function saveDailyEntry(newEntry: DailyEntry): void {
  const entries = getDailyEntries();
  const index = entries.findIndex((entry) => entry.date === newEntry.date);

  if (index !== -1) {
    // Update existing
    entries[index] = newEntry;
  } else {
    // Insert new
    entries.push(newEntry);
  }
  saveDailyEntries(entries);
}

/* -------------- WEEKLY SUMMARIES -------------- */
export function getWeeklySummaries(): WeeklySummary[] {
  if (typeof window === "undefined") return [];
  const data = window.localStorage.getItem(WEEKLY_SUMMARIES_KEY);
  return data ? (JSON.parse(data) as WeeklySummary[]) : [];
}

export function saveWeeklySummaries(summaries: WeeklySummary[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WEEKLY_SUMMARIES_KEY, JSON.stringify(summaries));
}

/**
 * Utility to add/update a weekly summary by week number.
 */

export function saveWeeklySummary(newSummary: WeeklySummary): void {
  const summaries = getWeeklySummaries();
  const index = summaries.findIndex(
    (summary) => summary.weekNumber === newSummary.weekNumber
  );

  if (index !== -1) {
    // Update existing
    summaries[index] = newSummary;
  } else {
    // Insert new
    summaries.push(newSummary);
  }
  saveWeeklySummaries(summaries);
}

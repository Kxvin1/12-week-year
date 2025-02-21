"use client";
import { DailyEntry } from "./types";

/**
 * Create a new DailyEntry based on a "template" of tasks (names only),
 * setting all tiers to "S" and notes to "" by default.
 */
export function createEntryFromTemplate(
  date: string,
  taskNames: string[]
): DailyEntry {
  return {
    date,
    tasks: taskNames.map((name) => ({
      taskId: name,
      tier: "S",
      notes: "",
    })),
  };
}

/**
 * Given a date, find the most recent (past) entry if any,
 * copy its task names to create a new entry for the date.
 */
export function buildNewEntry(
  entries: DailyEntry[],
  newDate: string
): DailyEntry {
  // 1) Filter entries that are strictly before newDate
  const olderEntries = entries.filter((e) => e.date < newDate);

  // 2) Sort descending by date => olderEntries[0] is the most recent
  olderEntries.sort((a, b) => b.date.localeCompare(a.date));

  if (olderEntries.length === 0) {
    // No previous day at all => start empty
    return { date: newDate, tasks: [] };
  }

  // 3) Use tasks from olderEntries[0], ignoring tier/notes
  const template = olderEntries[0].tasks.map((t) => t.taskId);
  return createEntryFromTemplate(newDate, template);
}

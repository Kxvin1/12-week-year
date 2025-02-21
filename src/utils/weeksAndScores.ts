"use client";
import { DailyEntry } from "./types";
import { getBaseMondayDate } from "@/utils/mondayHelperFunctions";

/* -------------- LOGIC FOR WEEKS & SCORES -------------- */
export function determineCurrentWeekNumber(dailyEntries: DailyEntry[]): number {
  if (dailyEntries.length === 0) return 1;
  const uniqueDays = new Set(dailyEntries.map((day) => day.date));
  const countDays = uniqueDays.size;
  const weekNum = Math.floor((countDays - 1) / 7) + 1;
  return weekNum < 1 ? 1 : weekNum;
}

export function getDateRangeForWeek(weekNumber: number) {
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

export function dateStringToNumber(dateStr: string) {
  return parseInt(dateStr.replace(/-/g, ""), 10);
}

export function calculateWeeklyScore(
  dailyEntries: DailyEntry[]
): number | null {
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

export function computeCurrentWeekScore(
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

export function computeWeekScore(
  weekNumber: number,
  allDaily: DailyEntry[]
): number {
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

/**
 * Map each tier to Tailwind color classes
 */
export function getTierColor(tier: "S" | "A" | "B" | "C", selected: boolean) {
  switch (tier) {
    case "S":
      return selected
        ? "bg-green-600 text-white"
        : "bg-green-200 text-green-800/40";
    case "A":
      return selected
        ? "bg-blue-600 text-white"
        : "bg-blue-200 text-blue-800/40";
    case "B":
      return selected
        ? "bg-orange-600 text-white"
        : "bg-orange-200 text-orange-800/40";
    case "C":
      return selected ? "bg-red-600 text-white" : "bg-red-200 text-red-800/40";
    default:
      return "bg-gray-200 text-gray-800";
  }
}

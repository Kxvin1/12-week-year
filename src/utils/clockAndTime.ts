"use client";
/* -------------- TIME HELPER -------------- */
/**
 * Format the current time as:
 * 12:50 A.M. | March 07 2025
 *
 * We'll update this every second via setInterval.
 */
export function formatTime(date: Date): string {
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

/**
 * PST-based current date (naive approach)
 */
export function getTodayPST() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const laDateString = now.toLocaleDateString("en-US", options);
  const [month, day, year] = laDateString.split("/");
  return `${year}-${month}-${day}`;
}

// Helper to increment/decrement a date string
export function shiftDate(dateStr: string, days: number) {
  const dateObj = new Date(dateStr);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj.toISOString().split("T")[0];
}

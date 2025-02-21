"use client";

/* -------------- DYNAMIC MONDAY STORAGE -------------- */
export function getStoredMondayDate(): Date {
  const stored =
    typeof window !== "undefined"
      ? window.localStorage.getItem("baseMonday")
      : null;

  if (stored) {
    return new Date(`${stored}T08:00:00.000Z`);
  } else {
    return new Date("2025-02-03T08:00:00.000Z");
  }
}

export function storeMondayDate(isoDateStr: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("baseMonday", isoDateStr);
  }
}

export function getBaseMondayDate(): Date {
  return getStoredMondayDate();
}

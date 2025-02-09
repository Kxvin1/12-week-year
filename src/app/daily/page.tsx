"use client";

import { useState, useEffect } from "react";
import { getDailyEntries, saveDailyEntry } from "../../utils/localStorage";
import { DailyEntry } from "@/utils/types";

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState("2025-02-05");
  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);

  useEffect(() => {
    const entries = getDailyEntries();
    const existing = entries.find((e) => e.date === selectedDate);

    if (existing) {
      setDailyEntry(existing);
    } else {
      setDailyEntry({ date: selectedDate, tasks: [] });
    }
  }, [selectedDate]);

  function handleSave() {
    if (dailyEntry) {
      saveDailyEntry(dailyEntry);
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">Daily Tasks</h1>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      {/* Render tasks, handle changes */}
      {/* Example mapping over dailyEntry.tasks */}
      {/* Then a "Save" button that calls handleSave */}
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { getDailyEntries, saveDailyEntry } from "@/utils/localStorage";
import { DailyEntry } from "@/utils/types";

// Helper to increment/decrement a date string
function shiftDate(dateStr: string, days: number) {
  const dateObj = new Date(dateStr);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj.toISOString().split("T")[0];
}

export default function DailyPage() {
  // 1) Default to current date
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);

  // New task input
  const [newTaskName, setNewTaskName] = useState("");

  useEffect(() => {
    const entries = getDailyEntries();
    const existing = entries.find((e) => e.date === selectedDate);
    if (existing) {
      setDailyEntry(existing);
    } else {
      setDailyEntry({ date: selectedDate, tasks: [] });
    }
  }, [selectedDate]);

  function handleAddTask() {
    if (!newTaskName || !dailyEntry) return;
    const updatedEntry = { ...dailyEntry };
    updatedEntry.tasks.push({
      taskId: newTaskName,
      tier: "C", // default tier
      notes: "",
    });
    setDailyEntry(updatedEntry);
    setNewTaskName("");
  }

  function handleTierChange(taskIndex: number, tier: "S" | "A" | "B" | "C") {
    if (!dailyEntry) return;
    const updatedEntry = { ...dailyEntry };
    updatedEntry.tasks[taskIndex].tier = tier;
    setDailyEntry(updatedEntry);
  }

  function handleNotesChange(taskIndex: number, newNotes: string) {
    if (!dailyEntry) return;
    const updatedEntry = { ...dailyEntry };
    updatedEntry.tasks[taskIndex].notes = newNotes;
    setDailyEntry(updatedEntry);
  }

  function handleSave() {
    if (dailyEntry) {
      saveDailyEntry(dailyEntry);
      alert("Daily tasks saved!");
    }
  }

  function handlePrevDay() {
    setSelectedDate((prev) => shiftDate(prev, -1));
  }

  function handleNextDay() {
    setSelectedDate((prev) => shiftDate(prev, 1));
  }

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] min-h-screen p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Daily Tasks</h1>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePrevDay}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          Previous Day
        </button>

        <label className="font-semibold">
          Select Date:{" "}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded ml-2"
          />
        </label>

        <button
          onClick={handleNextDay}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          Next Day
        </button>
      </div>

      {dailyEntry && (
        <div className="w-full max-w-3xl">
          <div className="flex items-center mb-4">
            <input
              type="text"
              placeholder="New Task Name"
              className="border p-2 mr-2 w-full rounded"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
            <button
              onClick={handleAddTask}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Add Task
            </button>
          </div>

          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-400">
                <th className="border p-2">Task Name</th>
                <th className="border p-2">Tier (S/A/B/C)</th>
                <th className="border p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {dailyEntry.tasks.map((task, index) => (
                <tr key={index} className="text-center bg-gray-200">
                  <td className="border p-2">{task.taskId}</td>
                  <td className="border p-2">
                    {/* Radio group for S/A/B/C */}
                    {(["S", "A", "B", "C"] as const).map((tier) => (
                      <label key={tier} className="mr-2">
                        <input
                          type="radio"
                          name={`tier-${index}`}
                          value={tier}
                          checked={task.tier === tier}
                          onChange={() => handleTierChange(index, tier)}
                        />
                        <span className="ml-1">{tier}</span>
                      </label>
                    ))}
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      className="border rounded p-1 w-full"
                      value={task.notes}
                      placeholder="Notes..."
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded"
            >
              Save Daily Tasks
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

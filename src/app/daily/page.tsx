"use client";

import { useState, useEffect } from "react";
import {
  getDailyEntries,
  saveDailyEntry,
  DailyEntry,
} from "@/utils/localStorage";

// Helper to increment/decrement a date string
function shiftDate(dateStr: string, days: number) {
  const dateObj = new Date(dateStr);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj.toISOString().split("T")[0];
}

/** Get today's date in PST (naive approach). */
function getTodayPST() {
  const laString = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  const laDate = new Date(laString);
  return laDate.toISOString().split("T")[0]; // YYYY-MM-DD
}

export default function DailyPage() {
  // PST default date instead of the system UTC date
  const [selectedDate, setSelectedDate] = useState(getTodayPST());
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
      tier: "S", // default tier
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
    <div className="py-4">
      <h1 className="text-3xl font-bold mb-6 flex justify-center">
        Daily Tasks
      </h1>

      <div className="flex items-center gap-4 mb-6 justify-center">
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
            className="border p-2 rounded ml-2 text-gray-800"
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
        <div>
          <div className="flex items-center mb-4 text-gray-800">
            <input
              type="text"
              placeholder="New Task Name"
              className="border p-2 mr-2 w-full rounded text-gray-800"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
            <button
              onClick={handleAddTask}
              className="bg-green-600 text-white px-8 py-2 rounded-full"
            >
              Add Task
            </button>
          </div>

          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-400 text-gray-800">
                <th className="border p-2">Task Name</th>
                <th className="border p-2">Tier (S/A/B/C)</th>
                <th className="border p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {dailyEntry.tasks.map((task, index) => (
                <tr
                  key={index}
                  className="text-center bg-gray-200 text-gray-800"
                >
                  <td className="border p-2">{task.taskId}</td>
                  <td className="border p-2">
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
    </div>
  );
}

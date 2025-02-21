"use client";

import { useState, useEffect } from "react";
import { getDailyEntries, saveDailyEntry } from "@/utils/localStorage";
import { DailyEntry } from "@/utils/types";
import { getTodayPST, shiftDate } from "@/utils/clockAndTime";
import { getTierColor } from "@/utils/weeksAndScores";

/**
 * Create a new DailyEntry based on a "template" of tasks (names only),
 * setting all tiers to "S" and notes to "" by default.
 */
function createEntryFromTemplate(
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
function buildNewEntry(entries: DailyEntry[], newDate: string): DailyEntry {
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

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayPST());
  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);

  // New task input
  const [newTaskName, setNewTaskName] = useState("");

  // We'll store which task row is in "edit" mode for the name
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    // Each time user picks a new date, we load or build an entry
    const allEntries = getDailyEntries();
    const existing = allEntries.find((e) => e.date === selectedDate);

    if (existing) {
      // If we already have an entry for that date, load it
      setDailyEntry(existing);
    } else {
      // Build a new entry from the most recent day
      const newEntry = buildNewEntry(allEntries, selectedDate);
      saveDailyEntry(newEntry);
      setDailyEntry(newEntry);
    }
    // Reset any editing
    setEditingIndex(null);
    setEditName("");
  }, [selectedDate]);

  // Add a brand-new task to the current day
  function handleAddTask() {
    if (!newTaskName || !dailyEntry) return;
    const updatedEntry: DailyEntry = {
      ...dailyEntry,
      tasks: [
        ...dailyEntry.tasks,
        { taskId: newTaskName, tier: "S", notes: "" },
      ],
    };
    setDailyEntry(updatedEntry);
    setNewTaskName("");
  }

  // Edit button -> start editing
  function handleEditTask(index: number) {
    if (!dailyEntry) return;
    setEditingIndex(index);
    setEditName(dailyEntry.tasks[index].taskId);
  }

  // Save the new name
  function handleSaveTaskName(index: number) {
    if (!dailyEntry) return;
    if (!editName.trim()) {
      alert("Task name cannot be empty!");
      return;
    }
    const updatedEntry = { ...dailyEntry };
    updatedEntry.tasks[index].taskId = editName.trim();
    setDailyEntry(updatedEntry);
    setEditingIndex(null);
    setEditName("");
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingIndex(null);
    setEditName("");
  }

  // Delete a task
  function handleDeleteTask(index: number) {
    if (!dailyEntry) return;
    const confirmed = confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    const updatedEntry = { ...dailyEntry };
    updatedEntry.tasks.splice(index, 1);
    setDailyEntry(updatedEntry);
  }

  // Update the tier for an existing task
  function handleTierChange(taskIndex: number, tier: "S" | "A" | "B" | "C") {
    if (!dailyEntry) return;
    const updatedEntry = { ...dailyEntry };
    updatedEntry.tasks[taskIndex].tier = tier;
    setDailyEntry(updatedEntry);
  }

  // Update notes for an existing task
  function handleNotesChange(taskIndex: number, newNotes: string) {
    if (!dailyEntry) return;
    const updatedEntry = { ...dailyEntry };
    updatedEntry.tasks[taskIndex].notes = newNotes;
    setDailyEntry(updatedEntry);
  }

  // Save changes for the current day
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
    setSelectedDate((prev) => shiftDate(prev, +1));
  }

  return (
    <>
      {/* Gradient Hero */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 py-12 text-center text-white rounded-lg">
        <h1 className="text-4xl font-bold mb-2">Daily Tasks</h1>
        <p className="max-w-xl mx-auto">
          Log tasks and assign tiers for each day to track your progress.
        </p>
      </div>

      {/* White Card */}
      <div className="max-w-5xl mx-auto -mt-10 pb-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Date Navigation */}
          <div className="flex items-center gap-4 mb-6 justify-center">
            <button
              onClick={handlePrevDay}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
            >
              Previous Day
            </button>

            <label className="font-semibold text-gray-700">
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
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
            >
              Next Day
            </button>
          </div>

          {dailyEntry && (
            <div className="max-w-4xl mx-auto">
              {/* Add Task */}
              <div className="flex items-center mb-4 text-gray-800">
                <input
                  type="text"
                  placeholder="New Task Name"
                  className="border p-2 mr-2 w-10/12 rounded text-gray-800"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
                <button
                  onClick={handleAddTask}
                  className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition"
                >
                  Add Task
                </button>
              </div>

              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-400 text-gray-800">
                    <th className="border p-2 w-1/4">Task Name</th>
                    <th className="border p-2 w-1/6">Tier (S/A/B/C)</th>
                    <th className="border p-2 w-1/2">Notes</th>
                    <th className="border p-2 w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyEntry.tasks.map((task, index) => {
                    const isSelected = (val: "S" | "A" | "B" | "C") =>
                      task.tier === val;
                    return (
                      <tr
                        key={index}
                        className="text-center bg-gray-200 text-gray-800"
                      >
                        {/* Task Name Cell */}
                        <td className="border p-2">
                          {editingIndex === index ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                className="border rounded p-1 w-full"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            </div>
                          ) : (
                            <span>{task.taskId}</span>
                          )}
                        </td>

                        {/* Tier Column */}
                        <td className="border p-2">
                          <div className="flex gap-2 justify-center">
                            {(["S", "A", "B", "C"] as const).map((tierVal) => {
                              const colorClass = getTierColor(
                                tierVal,
                                isSelected(tierVal)
                              );
                              return (
                                <button
                                  key={tierVal}
                                  onClick={() =>
                                    handleTierChange(index, tierVal)
                                  }
                                  className={`px-3 py-1 rounded-full text-sm font-semibold ${colorClass} transition-colors duration-200`}
                                >
                                  {tierVal}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Notes Column */}
                        <td className="border p-2">
                          <textarea
                            className="border rounded p-1 w-full"
                            rows={3}
                            value={task.notes}
                            placeholder="Notes..."
                            onChange={(e) =>
                              handleNotesChange(index, e.target.value)
                            }
                          />
                        </td>

                        {/* Actions Column (Edit/Delete) */}
                        <td className="border p-2">
                          {editingIndex === index ? (
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <button
                                onClick={() => handleSaveTaskName(index)}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-400 px-3 py-1 rounded hover:bg-gray-500 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <button
                                onClick={() => handleEditTask(index)}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTask(index)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-center">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                >
                  Save Daily Tasks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

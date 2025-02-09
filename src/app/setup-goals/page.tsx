"use client";

import { useState, useEffect } from "react";
import { getGoals, saveGoals } from "@/utils/localStorage";
import { Goal } from "@/utils/types";
import { v4 as uuidv4 } from "uuid";

export default function SetupGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Track which goal is being edited
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    setGoals(getGoals());
  }, []);

  function handleAddGoal() {
    if (!title) return; // at least need a title
    const newGoals = [
      ...goals,
      { id: uuidv4(), title: title.trim(), description: description.trim() },
    ];
    saveGoals(newGoals);
    setGoals(newGoals);
    setTitle("");
    setDescription("");
  }

  function handleDeleteGoal(id: string) {
    const updated = goals.filter((goal) => goal.id !== id);
    saveGoals(updated);
    setGoals(updated);
  }

  function handleEditGoal(id: string) {
    const goalToEdit = goals.find((g) => g.id === id);
    if (!goalToEdit) return;
    setEditingId(id);
    setEditTitle(goalToEdit.title);
    setEditDescription(goalToEdit.description || "");
  }

  function handleSaveEdit(id: string) {
    const updatedGoals = goals.map((g) => {
      if (g.id === id) {
        return {
          ...g,
          title: editTitle.trim(),
          description: editDescription.trim(),
        };
      }
      return g;
    });
    saveGoals(updatedGoals);
    setGoals(updatedGoals);
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  }

  return (
    <div className="py-4">
      <h1 className="text-3xl font-bold mb-6">Setup Goals</h1>

      <div className="mb-8 max-w-xl">
        <h2 className="text-xl font-semibold mb-2">Add New Goal</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Title"
            className="border p-2 flex-1 rounded text-gray-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description"
            className="border p-2 flex-1 rounded text-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            onClick={handleAddGoal}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save Goal
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Goals List</h2>
      <ul className="space-y-2 max-w-xl">
        {goals.map((g) => (
          <li
            key={g.id}
            className="bg-gray-200 p-3 rounded flex flex-col text-gray-800"
          >
            {editingId === g.id ? (
              <>
                {/* Edit form */}
                <div className="flex flex-col sm:flex-row gap-2 mb-2 text-gray-800">
                  <input
                    type="text"
                    className="border p-2 flex-1 rounded text-gray-800"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    className="border p-2 flex-1 rounded text-gray-800"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(g.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-400 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <strong className="text-lg">{g.title}</strong>
                {g.description && (
                  <span className="text-sm">{g.description}</span>
                )}

                <div className="mt-2 flex gap-4">
                  <button
                    onClick={() => handleEditGoal(g.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

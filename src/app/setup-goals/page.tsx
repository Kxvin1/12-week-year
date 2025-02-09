"use client";

import { useState, useEffect, KeyboardEvent } from "react";
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
    if (!title) return; // must have at least a title
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

  // Press Enter in either field -> handleAddGoal()
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleAddGoal();
    }
  }

  return (
    <>
      {/* Gradient Hero */}
      <div className="bg-gradient-to-r from-pink-500 to-yellow-400 py-12 text-center text-white rounded-lg">
        <h1 className="text-4xl font-bold mb-2">Setup Goals</h1>
        <p className="max-w-xl mx-auto">
          Create and manage your 12-week goals to stay on track!
        </p>
      </div>

      {/* Main white card */}
      <div className="max-w-5xl mx-auto -mt-10 pb-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Add New Goal Form */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Add New Goal
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-8">
            <input
              type="text"
              placeholder="Title"
              className="border p-2 flex-1 rounded text-gray-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <input
              type="text"
              placeholder="Description"
              className="border p-2 flex-1 rounded text-gray-800"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleAddGoal}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Save Goal
            </button>
          </div>

          {/* Goals List */}
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Goals List
          </h2>
          <ul className="space-y-2">
            {goals.map((g) => (
              <li
                key={g.id}
                className="bg-gray-50 border rounded p-3 flex flex-col text-gray-800"
              >
                {editingId === g.id ? (
                  <>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
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
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-400 px-4 py-2 rounded hover:bg-gray-500 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <strong className="text-lg">{g.title}</strong>
                    {g.description && (
                      <span className="text-sm text-gray-600">
                        {g.description}
                      </span>
                    )}

                    <div className="mt-2 flex gap-4">
                      <button
                        onClick={() => handleEditGoal(g.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          {goals.length === 0 && (
            <p className="text-gray-600 mt-2">No goals added yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

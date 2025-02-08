"use client";

import { useState, useEffect } from "react";
import { getGoals, saveGoals } from "@/utils/localStorage";
import { Goal } from "@/utils/types";
import { v4 as uuidv4 } from "uuid";

export default function SetupGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setGoals(getGoals());
  }, []);

  function handleAddGoal() {
    const newGoals = [...goals, { id: uuidv4(), title, description }];
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

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">Setup Goals</h1>

      <div className="mb-6">
        <h2 className="text-xl">Add New Goal</h2>
        <input
          type="text"
          placeholder="Title"
          className="border p-2 mr-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          className="border p-2 mr-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          onClick={handleAddGoal}
          className="bg-blue-500 text-white px-4 py-2"
        >
          Save Goal
        </button>
      </div>

      <ul>
        {goals.map((g) => (
          <li key={g.id} className="mb-2">
            <strong>{g.title}</strong> - {g.description}
            <button
              onClick={() => handleDeleteGoal(g.id)}
              className="ml-2 text-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

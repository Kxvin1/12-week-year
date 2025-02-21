"use client";

import {
  getGoals,
  getDailyEntries,
  getWeeklySummaries as fetchWeeklySummaries,
  saveGoals,
  saveDailyEntries,
  saveWeeklySummaries,
} from "./localStorage";

/* -------------- IMPORT / EXPORT -------------- */
export function exportData() {
  const data = {
    goals: getGoals(),
    dailyEntries: getDailyEntries(),
    weeklySummaries: fetchWeeklySummaries(),
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "12-week-scoreboard-data.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const result = e?.target?.result;
      if (!result) return;
      const parsed = JSON.parse(result as string);

      if (parsed.goals) saveGoals(parsed.goals);
      if (parsed.dailyEntries) saveDailyEntries(parsed.dailyEntries);
      if (parsed.weeklySummaries) saveWeeklySummaries(parsed.weeklySummaries);

      alert("Data imported successfully! Please refresh the page.");
    } catch (err) {
      alert(`Error importing data. Invalid JSON file. Console Error: ${err}`);
    }
  };
  reader.readAsText(file);
}

/* -------------- CLEAR ALL DATA -------------- */
export function clearAllData() {
  if (confirm("Are you sure you want to DELETE ALL your data?")) {
    localStorage.clear();
    alert("All data has been cleared. The page will now refresh.");
    window.location.reload();
  }
}

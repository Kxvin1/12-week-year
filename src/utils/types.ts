// Overarching 12 week goal
export interface Goal {
  id: string;
  title: string;
  description?: string;
}

// One daily task entry
export interface DailyTask {
  taskId: string;
  tier: "S" | "A" | "B" | "C";
  notes?: string;
}

// Data for a single day's task
export interface DailyEntry {
  date: string; // 'YYYY-MM-DD
  tasks: DailyTask[];
}

// Weekly summary with reflection/notes
export interface WeeklySummary {
  weekNumber: number; // 1 through 12
  score: number;
  reflection?: string;
}

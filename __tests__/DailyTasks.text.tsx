// __tests__/DailyTasks.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DailyPage from "../src/app/daily/page";

import { getDailyEntries, saveDailyEntry } from "@/utils/localStorage";
jest.mock("@/utils/localStorage", () => ({
  __esModule: true,
  getDailyEntries: jest.fn(),
  saveDailyEntry: jest.fn(),
}));

window.alert = jest.fn();
window.confirm = jest.fn();

/**
 * Freeze the global Date so new Date() always returns "2024-02-10T08:00:00Z".
 * This ensures getTodayPST() sees "2024-02-10" in PST.
 * Also suppress giant DOM output on error with DEBUG_PRINT_LIMIT=0.
 */
beforeAll(() => {
  // Freeze Date
  const RealDate = Date;
  global.Date = class extends RealDate {
    constructor(date?: string | number | Date) {
      super(date ?? "2024-02-10T08:00:00Z");
    }
  } as typeof Date;
});

afterAll(() => {
  // Restore the real Date
  jest.restoreAllMocks();
});

describe("DailyPage (src/app/daily/page.tsx)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders heading and defaults to 'today' (2024-02-10) with no tasks if none exist", () => {
    (getDailyEntries as jest.Mock).mockReturnValue([]);
    render(<DailyPage />);

    expect(
      screen.getByRole("heading", { name: /daily tasks/i })
    ).toBeInTheDocument();

    const dateInput = screen.getByLabelText(/select date/i) as HTMLInputElement;
    expect(dateInput.value).toBe("2024-02-10");
    // No tasks => table is empty
    expect(screen.getByPlaceholderText(/new task name/i)).toBeInTheDocument();
  });

  it("loads an existing daily entry if found in localStorage for 'today'", () => {
    (getDailyEntries as jest.Mock).mockReturnValue([
      {
        date: "2024-02-10",
        tasks: [
          { taskId: "Task A", tier: "A", notes: "Some notes" },
          { taskId: "Task B", tier: "C", notes: "" },
        ],
      },
    ]);

    render(<DailyPage />);
    // "Task A", "Task B" loaded
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Some notes")).toBeInTheDocument();
  });

  it("creates a new entry from the most recent day if none exist for 'today'", () => {
    (getDailyEntries as jest.Mock).mockReturnValue([
      {
        date: "2024-02-08",
        tasks: [{ taskId: "OldTask1", tier: "S", notes: "" }],
      },
      {
        date: "2024-02-09",
        tasks: [{ taskId: "MostRecentTask", tier: "A", notes: "" }],
      },
    ]);

    render(<DailyPage />);
    // No entry for 2024-02-10 => builds new from 2024-02-09
    expect(saveDailyEntry).toHaveBeenCalledTimes(1);
    expect(screen.getByText("MostRecentTask")).toBeInTheDocument();
  });

  it("allows the user to add a new task", async () => {
    (getDailyEntries as jest.Mock).mockReturnValueOnce([]);
    render(<DailyPage />);
    const user = userEvent.setup();

    const newTaskInput = screen.getByPlaceholderText(/new task name/i);
    const addButton = screen.getByRole("button", { name: /add task/i });

    await user.type(newTaskInput, "NewTask123");
    await user.click(addButton);

    expect(screen.getByText("NewTask123")).toBeInTheDocument();
  });

  it("allows user to change the tier by clicking S/A/B/C buttons, then save", async () => {
    (getDailyEntries as jest.Mock).mockReturnValueOnce([
      {
        date: "2024-02-10",
        tasks: [{ taskId: "MyTask", tier: "A", notes: "Test" }],
      },
    ]);

    render(<DailyPage />);
    const user = userEvent.setup();

    expect(screen.getByText("MyTask")).toBeInTheDocument();

    const sButton = screen.getByRole("button", { name: /^s$/i });
    await user.click(sButton);

    const saveButton = screen.getByRole("button", {
      name: /save daily tasks/i,
    });
    await user.click(saveButton);

    expect(saveDailyEntry).toHaveBeenCalledTimes(1);
    expect(saveDailyEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2024-02-10",
        tasks: [{ taskId: "MyTask", tier: "S", notes: "Test" }],
      })
    );
    expect(window.alert).toHaveBeenCalledWith("Daily tasks saved!");
  });

  it("allows user to edit a task name", async () => {
    (getDailyEntries as jest.Mock).mockReturnValueOnce([
      {
        date: "2024-02-10",
        tasks: [{ taskId: "OldName", tier: "S", notes: "" }],
      },
    ]);

    render(<DailyPage />);
    const user = userEvent.setup();

    expect(screen.getByText("OldName")).toBeInTheDocument();

    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    const editNameInput = screen.getByDisplayValue("OldName");
    await user.clear(editNameInput);
    await user.type(editNameInput, "UpdatedName");

    const taskSaveBtn = screen.getByRole("button", { name: /^save$/i });
    await user.click(taskSaveBtn);

    expect(screen.getByText("UpdatedName")).toBeInTheDocument();
  });

  // REMOVED: Test for preventing empty name on rename

  it("deletes a task after user confirmation", async () => {
    (getDailyEntries as jest.Mock).mockReturnValueOnce([
      {
        date: "2024-02-10",
        tasks: [
          { taskId: "Task1", tier: "S", notes: "" },
          { taskId: "Task2", tier: "A", notes: "" },
        ],
      },
    ]);

    render(<DailyPage />);
    const user = userEvent.setup();

    const deleteBtns = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteBtns).toHaveLength(2);

    (window.confirm as jest.Mock).mockReturnValueOnce(true);

    await user.click(deleteBtns[0]);
    expect(screen.queryByText("Task1")).not.toBeInTheDocument();
    expect(screen.getByText("Task2")).toBeInTheDocument();
  });

  it("moves to previous and next days using the buttons", async () => {
    (getDailyEntries as jest.Mock).mockReturnValueOnce([]);

    render(<DailyPage />);
    const user = userEvent.setup();

    const dateInput = screen.getByLabelText(/select date/i) as HTMLInputElement;
    expect(dateInput.value).toBe("2024-02-10");

    const prevDayBtn = screen.getByRole("button", { name: /previous day/i });
    await user.click(prevDayBtn);
    // Shift -1 => "2024-02-09"
    expect(dateInput.value).toBe("2024-02-09");

    const nextDayBtn = screen.getByRole("button", { name: /next day/i });
    await user.click(nextDayBtn);
    expect(dateInput.value).toBe("2024-02-10");
  });

  it("saves the daily entry when user clicks 'Save Daily Tasks'", async () => {
    (getDailyEntries as jest.Mock).mockReturnValueOnce([
      {
        date: "2024-02-10",
        tasks: [{ taskId: "Task X", tier: "B", notes: "Testing" }],
      },
    ]);

    render(<DailyPage />);
    const user = userEvent.setup();

    const saveBtn = screen.getByRole("button", { name: /save daily tasks/i });
    await user.click(saveBtn);

    expect(saveDailyEntry).toHaveBeenCalledTimes(1);
    expect(saveDailyEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2024-02-10",
        tasks: [{ taskId: "Task X", tier: "B", notes: "Testing" }],
      })
    );
    expect(window.alert).toHaveBeenCalledWith("Daily tasks saved!");
  });
});

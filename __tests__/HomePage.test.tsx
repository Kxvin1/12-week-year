// __tests__/HomePage.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "../src/app/page";
import {
  getGoals,
  getDailyEntries,
  getWeeklySummaries,
} from "@/utils/localStorage";

jest.mock("@/utils/localStorage", () => ({
  __esModule: true,
  getGoals: jest.fn(),
  getDailyEntries: jest.fn(),
  getWeeklySummaries: jest.fn(),
  saveGoals: jest.fn(),
  saveDailyEntries: jest.fn(),
  saveWeeklySummaries: jest.fn(),
}));

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});
window.alert = jest.fn();
window.confirm = jest.fn();

describe("HomePage (src/app/page.tsx)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders headings and static text when no data is present", () => {
    (getGoals as jest.Mock).mockReturnValueOnce([]);
    (getDailyEntries as jest.Mock).mockReturnValueOnce([]);
    (getWeeklySummaries as jest.Mock).mockReturnValueOnce([]);

    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /the 12-week year/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/achieve more in 12 weeks/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /getting started/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("You haven't added any 12-week goals yet.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("No weekly summaries found yet.")
    ).toBeInTheDocument();
  });

  it("renders the current week number and score from mocked daily entries", () => {
    (getGoals as jest.Mock).mockReturnValueOnce([]);
    (getDailyEntries as jest.Mock).mockReturnValueOnce([
      { date: "2025-02-03", tasks: [{ title: "Task A", tier: "S" }] },
      { date: "2025-02-04", tasks: [{ title: "Task B", tier: "A" }] },
    ]);
    (getWeeklySummaries as jest.Mock).mockReturnValueOnce([]);

    render(<HomePage />);
    expect(screen.getByText(/current week:/i)).toBeInTheDocument();
    expect(screen.getByText(/score so far:/i)).toBeInTheDocument();
    expect(screen.getByText(/current week: #/i)).toHaveTextContent("1");
    expect(screen.getByText("Score So Far: 88%")).toBeInTheDocument();
  });

  it("handles date selection for choosing Monday", () => {
    (getGoals as jest.Mock).mockReturnValue([]);
    (getDailyEntries as jest.Mock).mockReturnValue([]);
    (getWeeklySummaries as jest.Mock).mockReturnValue([]);

    render(<HomePage />);

    // Grab the date input by label:
    const dateInput = screen.getByLabelText(/choose your start monday/i);

    // Mock reload
    Object.defineProperty(window, "location", {
      value: { reload: jest.fn() },
      writable: true,
    });

    // Fire a single change event with the final date string
    fireEvent.change(dateInput, { target: { value: "2025-02-05" } });

    // The code sees day != 1 => picks nearest Monday => triggers alert & reload
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("Please pick a Monday date! Nearest Monday:")
    );
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("allows exporting data (clicking the export button)", async () => {
    const user = userEvent.setup();
    (getGoals as jest.Mock).mockReturnValue([
      { id: "goal-1", title: "Run a marathon" },
    ]);
    (getDailyEntries as jest.Mock).mockReturnValue([]);
    (getWeeklySummaries as jest.Mock).mockReturnValue([]);

    render(<HomePage />);

    const exportBtn = screen.getByRole("button", { name: /export data/i });
    expect(exportBtn).toBeInTheDocument();

    global.URL.createObjectURL = jest.fn(() => "mock-url");
    await user.click(exportBtn);
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("displays existing goals, weekly summaries, and overall average from mock data", () => {
    (getGoals as jest.Mock).mockReturnValueOnce([
      { id: "g1", title: "Goal One" },
      { id: "g2", title: "Goal Two" },
    ]);
    (getDailyEntries as jest.Mock).mockReturnValueOnce([
      {
        date: "2025-02-03",
        tasks: [{ title: "Task A", tier: "S" }],
      },
      {
        date: "2025-02-04",
        tasks: [{ title: "Task B", tier: "B" }],
      },
    ]);
    (getWeeklySummaries as jest.Mock).mockReturnValueOnce([
      { weekNumber: 1, reflection: "Week 1 reflection" },
      { weekNumber: 2, reflection: "Week 2 reflection" },
    ]);

    render(<HomePage />);
    expect(screen.getByText("Goal One")).toBeInTheDocument();
    expect(screen.getByText("Goal Two")).toBeInTheDocument();
    expect(screen.getByText("Week #")).toBeInTheDocument();
    expect(screen.getByText("Week 1 reflection")).toBeInTheDocument();
    expect(screen.getByText("Week 2 reflection")).toBeInTheDocument();
    expect(screen.getByText(/overall average score:/i)).toBeInTheDocument();
  });
});

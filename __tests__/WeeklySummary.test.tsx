// __tests__/WeeklySummary.test.tsx

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WeeklySummaryPage from "../src/app/weekly-summary/page";

import {
  getDailyEntries,
  getWeeklySummaries,
  saveWeeklySummary,
} from "@/utils/localStorage";

jest.mock("@/utils/localStorage", () => ({
  __esModule: true,
  getDailyEntries: jest.fn(),
  getWeeklySummaries: jest.fn(),
  saveWeeklySummary: jest.fn(),
}));

window.alert = jest.fn();
window.confirm = jest.fn();

// Suppress huge DOM output on failures
beforeAll(() => {
  process.env.DEBUG_PRINT_LIMIT = "0";
});

describe("WeeklySummaryPage - Final Revision", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows no summaries if daily entries are empty, defaults to week #1", () => {
    (getDailyEntries as jest.Mock).mockReturnValue([]);
    (getWeeklySummaries as jest.Mock).mockReturnValue([]);

    render(<WeeklySummaryPage />);

    expect(
      screen.getByRole("heading", { name: /weekly summary/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/no weekly summaries yet/i)).toBeInTheDocument();

    const select = screen.getByLabelText(/select week/i) as HTMLSelectElement;
    expect(select.value).toBe("1");
  });

  it("when user selects week #2 => yields 75% score with tasks on 2025-02-10", async () => {
    const user = userEvent.setup();

    // S=4 + B=2 => total=6, count=2 => average=3 => 75%
    (getDailyEntries as jest.Mock).mockReturnValue([
      {
        date: "2025-02-10",
        tasks: [{ tier: "S" }, { tier: "B" }],
      },
    ]);
    (getWeeklySummaries as jest.Mock).mockReturnValue([]);

    render(<WeeklySummaryPage />);

    // Manually pick week #2
    const select = screen.getByLabelText(/select week/i) as HTMLSelectElement;
    await user.selectOptions(select, "2");
    expect(select.value).toBe("2");

    // We check "Computed Score:" text
    expect(screen.getByText("Computed Score:")).toBeInTheDocument();
    // Then get all "75%" occurrences
    const seventyFive = screen.getAllByText("75%");
    expect(seventyFive.length).toBeGreaterThanOrEqual(1);
  });

  it("when user selects week #3 => tasks => 75%, existing summary => reflection visible", async () => {
    const user = userEvent.setup();

    // For week #3 => 2025-02-17 -> 2025-02-23
    // We'll do one day => 2025-02-17 => A=3 => 75%
    (getDailyEntries as jest.Mock).mockReturnValue([
      {
        date: "2025-02-17",
        tasks: [{ tier: "A" }],
      },
    ]);
    // Existing summary for #3
    (getWeeklySummaries as jest.Mock).mockReturnValue([
      { weekNumber: 3, reflection: "My third week reflection" },
    ]);

    render(<WeeklySummaryPage />);

    const select = screen.getByLabelText(/select week/i) as HTMLSelectElement;
    await user.selectOptions(select, "3");
    expect(select.value).toBe("3");

    // Check "Computed Score:" and "75%"
    expect(screen.getByText("Computed Score:")).toBeInTheDocument();
    const seventyFive = screen.getAllByText("75%");
    expect(seventyFive.length).toBeGreaterThanOrEqual(1);

    // Reflection => in read-only box + table => getAllByText
    const found = screen.getAllByText("My third week reflection");
    expect(found.length).toBeGreaterThan(0);

    // "Loaded existing summary for Week #3"
    expect(
      screen.getByText(/loaded existing summary for week #3/i)
    ).toBeInTheDocument();
  });

  it("warns about empty reflection if tasks => score>0, must confirm to proceed", async () => {
    const user = userEvent.setup();

    // week #1 => 2/3 -> 2/9 => let's do date=2/3 => S=4 => 100%
    (getDailyEntries as jest.Mock).mockReturnValue([
      {
        date: "2025-02-03",
        tasks: [{ tier: "S" }],
      },
    ]);
    (getWeeklySummaries as jest.Mock).mockReturnValue([]);

    render(<WeeklySummaryPage />);

    expect(
      screen.getByText(/you have tasks this week but no reflection is saved/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit reflection/i }));
    const saveBtn = screen.getByRole("button", {
      name: /save weekly summary/i,
    });

    // confirm => false => no save
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    await user.click(saveBtn);
    expect(saveWeeklySummary).not.toHaveBeenCalled();

    // confirm => true => saves
    (window.confirm as jest.Mock).mockReturnValueOnce(true);
    await user.click(saveBtn);
    expect(saveWeeklySummary).toHaveBeenCalledTimes(1);
    expect(window.alert).toHaveBeenCalledWith("Weekly summary saved!");
  });

  it("user edits reflection => displayed in read-only + table after saving", async () => {
    const user = userEvent.setup();

    // Enough tasks in week #1 => doesn't matter
    (getDailyEntries as jest.Mock).mockReturnValue([
      { date: "2025-02-05", tasks: [{ tier: "A" }] },
    ]);
    (getWeeklySummaries as jest.Mock).mockReturnValue([]);

    render(<WeeklySummaryPage />);

    await user.click(screen.getByRole("button", { name: /edit reflection/i }));
    const textArea = screen.getByRole("textbox");
    await user.type(textArea, "Challenging week indeed.");

    (window.confirm as jest.Mock).mockReturnValue(true);
    await user.click(
      screen.getByRole("button", { name: /save weekly summary/i })
    );

    expect(saveWeeklySummary).toHaveBeenCalledTimes(1);
    expect(saveWeeklySummary).toHaveBeenCalledWith(
      expect.objectContaining({
        reflection: "Challenging week indeed.",
      })
    );
    expect(window.alert).toHaveBeenCalledWith("Weekly summary saved!");

    // Reflection might appear in multiple places => getAllByText
    const allRefs = screen.getAllByText("Challenging week indeed.");
    expect(allRefs.length).toBeGreaterThanOrEqual(1);
  });

  it("displays multiple summaries in table, each with dynamic scores (75%, 25%, etc.)", () => {
    (getWeeklySummaries as jest.Mock).mockReturnValue([
      { weekNumber: 1, reflection: "Ref1" },
      { weekNumber: 2, reflection: "Ref2" },
      { weekNumber: 3, reflection: "Ref3" },
    ]);

    // daily => #1 => S=4, B=2 => 6 => 2 => 3 => 75%
    // #2 => A=3 => 75% => #3 => C=1 => 25%
    (getDailyEntries as jest.Mock).mockReturnValue([
      { date: "2025-02-03", tasks: [{ tier: "S" }, { tier: "B" }] }, // #1
      { date: "2025-02-10", tasks: [{ tier: "A" }] }, // #2
      { date: "2025-02-17", tasks: [{ tier: "C" }] }, // #3
    ]);

    render(<WeeklySummaryPage />);

    // "Ref1", "Ref2", "Ref3" in table => could appear multiple times => getAllByText
    expect(screen.getAllByText("Ref1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ref2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ref3").length).toBeGreaterThanOrEqual(1);

    // Scores => "75%", "75%", "25%" in table
    // Possibly multiple "75%" => do getAllByText("75%")
    const seventyFive = screen.queryAllByText("75%");
    expect(seventyFive.length).toBeGreaterThanOrEqual(2);

    const twentyFive = screen.queryAllByText("25%");
    expect(twentyFive.length).toBeGreaterThanOrEqual(1);
  });
});

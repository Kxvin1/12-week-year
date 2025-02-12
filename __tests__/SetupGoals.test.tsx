// __tests__/SetupGoals.test.tsx

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The page to test
import SetupGoalsPage from "@/app/setup-goals/page";

// Named imports from localStorage
import { getGoals, saveGoals } from "@/utils/localStorage";

// We also need uuid for IDs, so we can mock it if we want stable IDs
// But it's optional to mock if you only check text & not the exact ID
import { v4 as uuidv4 } from "uuid";

// 1) Mock the entire localStorage module
jest.mock("@/utils/localStorage", () => ({
  __esModule: true,
  getGoals: jest.fn(),
  saveGoals: jest.fn(),
  // If you also rely on other exports like getDailyEntries, etc., you can add them here
}));

// 2) Optionally mock uuid if you want a predictable ID in tests
jest.mock("uuid", () => ({
  __esModule: true,
  v4: jest.fn(() => "mock-uuid-1234"),
}));

// 3) Mock window.localStorage if needed
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

describe("SetupGoalsPage (setup-goals.tsx)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders headings and empty goals initially", () => {
    // getGoals returns empty array initially
    (getGoals as jest.Mock).mockReturnValueOnce([]);

    render(<SetupGoalsPage />);

    // Page heading
    expect(
      screen.getByRole("heading", { name: /setup goals/i })
    ).toBeInTheDocument();
    // Subheading "Setup and manage your 12-week goals..."
    expect(
      screen.getByText(/setup and manage your 12-week goals to stay on track/i)
    ).toBeInTheDocument();

    // "Add New Goal" section
    expect(
      screen.getByRole("heading", { name: /add new goal/i })
    ).toBeInTheDocument();

    // Because getGoals returned [], we expect "No goals added yet."
    expect(screen.getByText(/no goals added yet/i)).toBeInTheDocument();
  });

  it("lets user add a new goal via form", async () => {
    // Suppose we start with 0 goals
    (getGoals as jest.Mock).mockReturnValueOnce([]);

    render(<SetupGoalsPage />);
    const user = userEvent.setup();

    // The form inputs
    const titleInput = screen.getByPlaceholderText(/title/i);
    const descInput = screen.getByPlaceholderText(/description/i);
    const saveButton = screen.getByRole("button", { name: /save goal/i });

    // Type into title + description
    await user.type(titleInput, "My First Goal");
    await user.type(descInput, "This is a test goal");
    // Click "Save Goal"
    await user.click(saveButton);

    // Expect saveGoals to be called with the new goal array
    // That new array will contain an object with id=mock-uuid-1234, title="My First Goal", etc.
    expect(saveGoals).toHaveBeenCalledTimes(1);
    expect(saveGoals).toHaveBeenCalledWith([
      {
        id: "mock-uuid-1234",
        title: "My First Goal",
        description: "This is a test goal",
      },
    ]);

    // The new goal should appear in the list
    expect(screen.getByText("My First Goal")).toBeInTheDocument();
    expect(screen.getByText("This is a test goal")).toBeInTheDocument();
  });

  it("won't add a goal if title is empty", async () => {
    // Start with empty
    (getGoals as jest.Mock).mockReturnValueOnce([]);

    render(<SetupGoalsPage />);
    const user = userEvent.setup();

    const titleInput = screen.getByPlaceholderText(/title/i);
    const descInput = screen.getByPlaceholderText(/description/i);
    const saveButton = screen.getByRole("button", { name: /save goal/i });

    // Type only description, no title
    await user.type(descInput, "No title provided");
    // Click "Save Goal"
    await user.click(saveButton);

    // saveGoals should not be called because handleAddGoal() checks for empty title
    expect(saveGoals).not.toHaveBeenCalled();

    // The page should still say "No goals added yet."
    expect(screen.getByText(/no goals added yet/i)).toBeInTheDocument();
  });

  it("edits an existing goal", async () => {
    (getGoals as jest.Mock).mockReturnValueOnce([
      {
        id: "mock-id-1",
        title: "Original Title",
        description: "Orig Desc",
      },
    ]);

    render(<SetupGoalsPage />);
    const user = userEvent.setup();

    // The "Edit" button
    const editButton = screen.getByRole("button", { name: /edit/i });
    expect(editButton).toBeInTheDocument();

    // Click "Edit"
    await user.click(editButton);

    // The form fields for editing appear
    const editTitleInput = screen.getByDisplayValue("Original Title");
    const editDescInput = screen.getByDisplayValue("Orig Desc");

    // Modify them
    await user.clear(editTitleInput);
    await user.type(editTitleInput, "Updated Title");
    await user.clear(editDescInput);
    await user.type(editDescInput, "Updated Desc");

    // Click "Save"
    const saveButton = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButton);

    // We expect saveGoals to be called with updated data
    expect(saveGoals).toHaveBeenCalledWith([
      {
        id: "mock-id-1",
        title: "Updated Title",
        description: "Updated Desc",
      },
    ]);

    // The updated text is rendered
    expect(screen.getByText("Updated Title")).toBeInTheDocument();
    expect(screen.getByText("Updated Desc")).toBeInTheDocument();
  });

  it("deletes a goal", async () => {
    (getGoals as jest.Mock).mockReturnValueOnce([
      { id: "g1", title: "Delete Me", description: "Temp" },
      { id: "g2", title: "Keep Me", description: "" },
    ]);

    render(<SetupGoalsPage />);
    const user = userEvent.setup();

    // "Delete" button for "Delete Me"
    // In the DOM, we likely see multiple "Delete" buttons. We can get the first one by using getAllByRole
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBe(2);

    // Let's click the first "Delete" (for "Delete Me")
    await user.click(deleteButtons[0]);

    // Expect saveGoals to be called with only "g2" left
    expect(saveGoals).toHaveBeenCalledWith([
      { id: "g2", title: "Keep Me", description: "" },
    ]);

    // "Delete Me" should no longer appear
    expect(screen.queryByText("Delete Me")).not.toBeInTheDocument();
    // "Keep Me" should still appear
    expect(screen.getByText("Keep Me")).toBeInTheDocument();
  });

  it("adds a goal on Enter key press", async () => {
    // Start empty
    (getGoals as jest.Mock).mockReturnValueOnce([]);

    render(<SetupGoalsPage />);
    const user = userEvent.setup();

    const titleInput = screen.getByPlaceholderText(/title/i);
    const descInput = screen.getByPlaceholderText(/description/i);

    // Type something in the title, then press Enter
    await user.type(titleInput, "Goal via Enter{enter}");

    // Since handleAddGoal is triggered on Enter, we expect a new goal in saved array
    // But let's see if the code does a single handleAddGoal on pressing Enter in Title input
    expect(saveGoals).toHaveBeenCalledTimes(1);

    // The new goal is displayed
    expect(screen.getByText("Goal via Enter")).toBeInTheDocument();

    // Because we typed {enter} in the title, the description is empty
    // That’s okay, it should still appear with no description
  });
});

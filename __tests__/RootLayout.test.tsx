// __tests__/RootLayout.test.tsx

import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "../src/app/layout";
import "@testing-library/jest-dom";

describe("RootLayout", () => {
  it("renders the navigation links, the footer, and the children correctly", () => {
    // 1. Render the RootLayout and pass some "children" content
    render(
      <RootLayout>
        <div data-testid="child-content">Test Child Content</div>
      </RootLayout>
    );

    // 2. Check if the navigation links appear
    // We can use "getByRole('link', { name: /home/i })" to find the link by accessible name
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /setup goals/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /daily tasks/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /weekly summary/i })
    ).toBeInTheDocument();

    // 3. Verify the child content was rendered inside the main
    expect(screen.getByTestId("child-content")).toHaveTextContent(
      "Test Child Content"
    );

    // 4. Check the footer text
    expect(screen.getByText("© 2025 The 12-Week Year")).toBeInTheDocument();
  });
});

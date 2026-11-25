import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockEnding } from "../api/mockData";
import { EndingScreen } from "./EndingScreen";

/**
 * Tests for the ending screen.
 * Covers showing the closing line, listing the topics the user explored,
 * and starting a new conversation (FR 4.3).
 */
describe("EndingScreen", () => {
  // ---------------------------------------------------------------
  // Test 1: Showing Wheeler-Nicholson's closing line
  // ---------------------------------------------------------------
  it("shows Wheeler-Nicholson's closing line", () => {
    render(<EndingScreen ending={mockEnding.node} state={mockEnding.state} onRestart={() => {}} />);

    // The closing line from the mock data appears on screen
    expect(screen.getByText(mockEnding.node.text)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Test 2: Listing explored topics with readable names
  // ---------------------------------------------------------------
  it("lists the topics the user explored using readable names", () => {
    render(<EndingScreen ending={mockEnding.node} state={mockEnding.state} onRestart={() => {}} />);

    // mockEnding visited "military", "founding" and "downfall".
    // The screen should show the readable names, not the internal ids.
    expect(screen.getByText("Army career")).toBeInTheDocument();
    expect(screen.getByText("Founding National Allied")).toBeInTheDocument();
    expect(screen.getByText("Losing the company")).toBeInTheDocument();
    expect(screen.queryByText("military")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Test 3: Handling a conversation where no topics were explored
  // ---------------------------------------------------------------
  it("shows a message when no topics were explored", () => {
    // Copy the mock state but with an empty topic list.
    // The ... (spread) copies every other field unchanged.
    const noTopics = { ...mockEnding.state, topicsVisited: [] };
    render(<EndingScreen ending={mockEnding.node} state={noTopics} onRestart={() => {}} />);

    expect(screen.getByText("You did not explore any topics this time.")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Test 4: Starting a new conversation (FR 4.3)
  // ---------------------------------------------------------------
  it("FR 4.3: lets the user start a new conversation", async () => {
    const onRestart = vi.fn();
    render(<EndingScreen ending={mockEnding.node} state={mockEnding.state} onRestart={onRestart} />);

    await userEvent.click(screen.getByRole("button", { name: "Start a new conversation" }));

    // Clicking once calls onRestart exactly once
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
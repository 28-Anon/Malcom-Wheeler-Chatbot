import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChoiceButtons } from "./ChoiceButtons";

/** Sample choices shared by the tests below. */
const choices = [
  { id: "a", text: "Tell me about the Army." },
  { id: "b", text: "How did you start publishing?" },
];

/**
 * Tests for the reply choice buttons.
 * Covers showing the available choices (FR 2.1), reporting which one was picked,
 * disabling while waiting for the server, and the empty state on the ending screen.
 */
describe("ChoiceButtons", () => {
  // ---------------------------------------------------------------
  // Test 1: Showing one button per choice (FR 2.1)
  // ---------------------------------------------------------------
  it("FR 2.1: shows one button for each choice", () => {
    // onChoose isn't needed here, so an empty function is passed in
    render(<ChoiceButtons choices={choices} onChoose={() => {}} />);

    // There is one button per choice, and the buttons show the choice text
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Tell me about the Army." })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Test 2: Reporting which choice was clicked
  // ---------------------------------------------------------------
  it("sends the id of the clicked choice", async () => {
    // A fake onChoose records which id the component reports
    const onChoose = vi.fn();
    render(<ChoiceButtons choices={choices} onChoose={onChoose} />);

    // Click the second choice, found by its visible text
    await userEvent.click(screen.getByRole("button", { name: "How did you start publishing?" }));

    // The component sends the id ("b"), not the text, as the server works with ids
    expect(onChoose).toHaveBeenCalledWith("b");
  });

  // ---------------------------------------------------------------
  // Test 3: Disabling buttons while waiting for a reply
  // ---------------------------------------------------------------
  it("disables the buttons while waiting for a reply", () => {
    // Writing just "disabled" is shorthand for disabled={true}
    render(<ChoiceButtons choices={choices} onChoose={() => {}} disabled />);

    // Every button must be disabled, so the user can't send two choices at once
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  // ---------------------------------------------------------------
  // Test 4: Showing nothing when there are no choices (ending screen)
  // ---------------------------------------------------------------
  it("shows nothing when there are no choices", () => {
    // render returns the container the component was drawn into
    const { container } = render(<ChoiceButtons choices={[]} onChoose={() => {}} />);

    // The component returns null when there are no choices, so nothing is drawn at all.
    // This is the case on the ending screen.
    expect(container).toBeEmptyDOMElement();
  });
});
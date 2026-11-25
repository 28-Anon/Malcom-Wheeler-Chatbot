import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MAX_QUESTION_LENGTH, QuestionInput } from "./QuestionInput";

/**
 * Tests for the free-text question box.
 * Covers sending a question (FR 1.1), blocking empty questions (FR 3.1)
 * and the length limit (FR 3.2), including boundary tests at the limit.
 */
describe("QuestionInput", () => {
  // ---------------------------------------------------------------
  // Test 1: Sending a question (FR 1.1)
  // ---------------------------------------------------------------
  it("FR 1.1: sends the typed question", async () => {
    // Arrange: a fake onSubmit that records how it was called, and a simulated user
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<QuestionInput onSubmit={onSubmit} />);

    // Act: type a question into the box (found by its label) and click Send
    await user.type(screen.getByLabelText("Ask your own question"), "Tell me about Superman");
    await user.click(screen.getByRole("button", { name: "Send" }));

    // Assert: the component passed exactly what was typed to onSubmit
    expect(onSubmit).toHaveBeenCalledWith("Tell me about Superman");
  });

  // ---------------------------------------------------------------
  // Test 2: Trimming spaces and clearing the box
  // ---------------------------------------------------------------
  it("trims spaces and clears the box after sending", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<QuestionInput onSubmit={onSubmit} />);
    const input = screen.getByLabelText("Ask your own question");

    // Type a question with spaces at both ends, then press Enter instead of clicking Send
    await user.type(input, "  Who was Donenfeld?  {Enter}");

    // The spaces are removed before sending, and the box is emptied afterwards
    expect(onSubmit).toHaveBeenCalledWith("Who was Donenfeld?");
    expect(input).toHaveValue("");
  });

  // ---------------------------------------------------------------
  // Test 3: Blocking empty or blank questions (FR 3.1)
  // ---------------------------------------------------------------
  it("FR 3.1: does not send an empty or blank question", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<QuestionInput onSubmit={onSubmit} />);

    // Send starts disabled because nothing has been typed yet
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    // Typing only spaces and pressing Enter must not get past the check
    await user.type(screen.getByLabelText("Ask your own question"), "   {Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  // ---------------------------------------------------------------
  // Test 4: Blocking questions over the length limit (FR 3.2)
  // ---------------------------------------------------------------
  it("FR 3.2: blocks questions over the limit and tells the user the limit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<QuestionInput onSubmit={onSubmit} />);

    // Paste one character more than the limit (pasting is faster than typing each key)
    await user.click(screen.getByLabelText("Ask your own question"));
    await user.paste("a".repeat(MAX_QUESTION_LENGTH + 1));
    await user.keyboard("{Enter}");

    // The error message appears (regex so small wording changes don't break the test),
    // Send is disabled, and nothing was sent
    expect(screen.getByText(/too long/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // Test 5: Allowing a question exactly at the limit (FR 3.2, boundary)
  // ---------------------------------------------------------------
  it("FR 3.2: allows a question exactly at the limit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<QuestionInput onSubmit={onSubmit} />);

    // Boundary test: exactly the limit must still be allowed.
    // Together with Test 4, this would catch a > vs >= mistake.
    await user.click(screen.getByLabelText("Ask your own question"));
    await user.paste("a".repeat(MAX_QUESTION_LENGTH));

    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });
});
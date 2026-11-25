import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChoiceButtons } from "./ChoiceButtons";

const choices = [
  { id: "a", text: "Tell me about the Army." },
  { id: "b", text: "How did you start publishing?" },
];

describe("ChoiceButtons", () => {
  it("FR 2.1: shows one button for each choice", () => {
    render(<ChoiceButtons choices={choices} onChoose={() => {}} />);

    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Tell me about the Army." })).toBeInTheDocument();
  });

  it("sends the id of the clicked choice", async () => {
    const onChoose = vi.fn();
    render(<ChoiceButtons choices={choices} onChoose={onChoose} />);

    await userEvent.click(screen.getByRole("button", { name: "How did you start publishing?" }));

    expect(onChoose).toHaveBeenCalledWith("b");
  });

  it("disables the buttons while waiting for a reply", () => {
    render(<ChoiceButtons choices={choices} onChoose={() => {}} disabled />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  it("shows nothing when there are no choices", () => {
    const { container } = render(<ChoiceButtons choices={[]} onChoose={() => {}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
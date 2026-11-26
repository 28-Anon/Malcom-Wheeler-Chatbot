import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../types/dialogue";
import { MessageList } from "./MessageList";

/** Sample conversation shared by the tests below. */
const messages: ChatMessage[] = [
  { id: "1", speaker: "mwn", text: "Major Malcolm Wheeler-Nicholson, at your service." },
  { id: "2", speaker: "user", text: "Tell me about the Army." },
  { id: "3", speaker: "mwn", text: "I joined the cavalry as a young man." },
];

/**
 * Tests for the conversation history.
 * Covers keeping earlier messages visible (FR 5.1), labelling who said each message,
 * and the screen reader settings that announce new messages.
 */
describe("MessageList", () => {
  // ---------------------------------------------------------------
  // Test 1: Showing every message in order (FR 5.1)
  // ---------------------------------------------------------------
  it("FR 5.1: shows every message in the order it was said", () => {
    render(<MessageList messages={messages} />);

    // Each message is one item in the list
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    // The first and last items match the first and last messages, so the order is kept
    expect(items[0]).toHaveTextContent("at your service");
    expect(items[2]).toHaveTextContent("I joined the cavalry");
  });

  // ---------------------------------------------------------------
  // Test 2: Labelling who said each message
  // ---------------------------------------------------------------
  it("labels each message with who said it", () => {
    render(<MessageList messages={messages} />);
    const items = screen.getAllByRole("listitem");

    // within() limits the search to one list item, so each label is checked
    // against the right message
    expect(within(items[0]).getByText("Wheeler-Nicholson")).toBeInTheDocument();
    expect(within(items[1]).getByText("You")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Test 3: Announcing new messages to screen readers
  // ---------------------------------------------------------------
  it("announces new messages to screen readers", () => {
    render(<MessageList messages={messages} />);

    // role="log" with aria-live="polite" makes screen readers read out new
    // messages without interrupting what the user is doing
    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
  });

  // ---------------------------------------------------------------
  // Test 4: Handling an empty conversation
  // ---------------------------------------------------------------
  it("shows no messages before the conversation starts", () => {
    render(<MessageList messages={[]} />);

    // queryAllBy returns an empty array instead of failing when nothing is found
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    // The log itself is still there, ready for the first message
    expect(screen.getByRole("log")).toBeInTheDocument();
  });
});
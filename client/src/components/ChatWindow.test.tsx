import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendChoice, sendQuestion, startConversation } from "../api/client";
import { mockEnding, mockStart } from "../api/mockData";
import type { DialogueResponse } from "../types/dialogue";
import { ChatWindow } from "./ChatWindow";

// Replace the real API functions with fakes, so each test controls what the "server" returns
vi.mock("../api/client");

/** A normal reply that is not the ending, used to check the conversation carries on. */
const mockReply: DialogueResponse = {
  node: { id: "military_01", text: "I joined the cavalry as a young man.", mood: "proud", type: "line" },
  choices: [{ id: "a", text: "What happened next?" }],
  state: { ...mockStart.state, topicsVisited: ["military"] },
};

/**
 * Tests for the main conversation screen, with the API replaced by fakes.
 * Covers the opening (FR 1.2), choices and typed questions (FR 1.1, FR 2.1),
 * the conversation history (FR 5.1), the ending and restart (FR 4.3)
 * and the server being unreachable (FR 3.4).
 */
describe("ChatWindow", () => {
  // Before every test: clear any fakes set by earlier tests,
  // then make the fake server return the opening by default
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(startConversation).mockResolvedValue(mockStart);
  });

  // ---------------------------------------------------------------
  // Test 1: Loading the opening line and suggested questions (FR 1.2)
  // ---------------------------------------------------------------
  it("FR 1.2: shows the opening line and suggested questions", async () => {
    render(<ChatWindow />);

    // While waiting for the server, a loading message is shown
    expect(screen.getByText(/is thinking/i)).toBeInTheDocument();

    // findBy waits for the element to appear (getBy would fail straight away)
    expect(await screen.findByText(mockStart.node.text)).toBeInTheDocument();

    // Every suggested question from the opening is shown as a button
    for (const choice of mockStart.choices) {
      expect(screen.getByRole("button", { name: choice.text })).toBeInTheDocument();
    }
  });

  // ---------------------------------------------------------------
  // Test 2: Picking a choice adds to the history (FR 2.1, FR 5.1)
  // ---------------------------------------------------------------
  it("FR 5.1: picking a choice adds the user's message and the reply to the history", async () => {
    vi.mocked(sendChoice).mockResolvedValue(mockReply);
    const user = userEvent.setup();
    render(<ChatWindow />);

    // Wait for the opening, then click the first suggested question
    await user.click(await screen.findByRole("button", { name: "Tell me about your time in the Army." }));

    // The reply appears, and the choice's id (not its text) was sent to the server
    expect(await screen.findByText(mockReply.node.text)).toBeInTheDocument();
    expect(sendChoice).toHaveBeenCalledWith("a");

    // History now has three messages: the opening, the user's choice and the reply
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    // The old choices are replaced by the reply's choices
    expect(screen.getByRole("button", { name: "What happened next?" })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Test 3: Asking a typed question (FR 1.1)
  // ---------------------------------------------------------------
  it("FR 1.1: sends a typed question and shows the reply", async () => {
    vi.mocked(sendQuestion).mockResolvedValue(mockReply);
    const user = userEvent.setup();
    render(<ChatWindow />);
    await screen.findByText(mockStart.node.text);

    await user.type(screen.getByLabelText("Ask your own question"), "Tell me about the cavalry{Enter}");

    expect(sendQuestion).toHaveBeenCalledWith("Tell me about the cavalry");
    expect(await screen.findByText(mockReply.node.text)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Test 4: Reaching the ending and starting again (FR 4.3)
  // ---------------------------------------------------------------
  it("FR 4.3: shows the ending screen and can start a new conversation", async () => {
    vi.mocked(sendChoice).mockResolvedValue(mockEnding);
    const user = userEvent.setup();
    render(<ChatWindow />);

    // Picking a choice that leads to the ending switches to the ending screen
    await user.click(await screen.findByRole("button", { name: "Tell me about your time in the Army." }));
    expect(await screen.findByRole("heading", { name: "The interview is over" })).toBeInTheDocument();

    // Restarting goes back to the opening line
    await user.click(screen.getByRole("button", { name: "Start a new conversation" }));
    expect(await screen.findByText(mockStart.node.text)).toBeInTheDocument();

    // The server was asked for an opening twice: once on load and once on restart
    expect(startConversation).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------
  // Test 5: Server unreachable, then retrying (FR 3.4)
  // ---------------------------------------------------------------
  it("FR 3.4: shows an error when the server cannot be reached, and can try again", async () => {
    // The first call fails as if the network were down. Later calls use the default from beforeEach.
    vi.mocked(startConversation).mockRejectedValueOnce(new Error("Network down"));
    const user = userEvent.setup();
    render(<ChatWindow />);

    // role="alert" is what screen readers announce straight away
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach the server/i);

    // Try again calls the server a second time, which now succeeds
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText(mockStart.node.text)).toBeInTheDocument();

    // The error message has gone
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
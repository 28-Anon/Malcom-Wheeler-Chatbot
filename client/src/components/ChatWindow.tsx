import { useEffect, useState } from "react";
import type { ChatMessage, DialogueResponse } from "../types/dialogue";
import { sendChoice, sendQuestion, startConversation } from "../api/client";
import { ChoiceButtons } from "./ChoiceButtons";
import { EndingScreen } from "./EndingScreen";
import { MessageList } from "./MessageList";
import { QuestionInput } from "./QuestionInput";

/** Creates a chat message with a unique id. */
function createMessage(speaker: ChatMessage["speaker"], text: string): ChatMessage {
  return { id: crypto.randomUUID(), speaker, text };
}

/**
 * Main conversation screen. Holds the conversation state, sends the user's
 * choices and questions to the API, and shows the replies, history and ending.
 */
export function ChatWindow() {
  const [current, setCurrent] = useState<DialogueResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Starts a fresh conversation and shows the opening line. */
  async function begin() {
    setLoading(true);
    setError(null);
    try {
      const response = await startConversation();
      setCurrent(response);
      setMessages([createMessage("mwn", response.node.text)]);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Adds the user's message to the history, sends the request, and shows the reply.
   * @param userText - What the user said, shown in the history.
   * @param request - The API call to make.
   */
  async function respond(userText: string, request: () => Promise<DialogueResponse>) {
    setLoading(true);
    setError(null);
    setMessages((previous) => [...previous, createMessage("user", userText)]);
    try {
      const response = await request();
      setCurrent(response);
      setMessages((previous) => [...previous, createMessage("mwn", response.node.text)]);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

    useEffect(() => {
    let cancelled = false;

    startConversation()
      .then((response) => {
        if (cancelled) return;
        setCurrent(response);
        setMessages([createMessage("mwn", response.node.text)]);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the server. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (current?.state.ended) {
    return <EndingScreen ending={current.node} state={current.state} onRestart={() => void begin()} />;
  }

  return (
    <main className="chat-window">
      <h1>Major Malcolm Wheeler-Nicholson</h1>

      <MessageList messages={messages} />

      {loading && <p className="chat-window__loading">Wheeler-Nicholson is thinking…</p>}

      {error && (
        <div role="alert" className="chat-window__error">
          <p>{error}</p>
          {!current && (
            <button type="button" onClick={() => void begin()}>
              Try again
            </button>
          )}
        </div>
      )}

      {current && (
        <>
          <ChoiceButtons
            choices={current.choices}
            onChoose={(choiceId) => {
              const choice = current.choices.find((option) => option.id === choiceId);
              if (choice) void respond(choice.text, () => sendChoice(choiceId));
            }}
            disabled={loading}
          />
          <QuestionInput
            onSubmit={(question) => void respond(question, () => sendQuestion(question))}
            disabled={loading}
          />
        </>
      )}
    </main>
  );
}
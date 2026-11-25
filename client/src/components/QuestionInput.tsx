import { useState } from "react";
import type { FormEvent } from "react";

/** Longest question the user can send. Must match the limit enforced by the server. */
export const MAX_QUESTION_LENGTH = 200;

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}

/**
 * Free-text box for typing a question to Wheeler-Nicholson.
 * Empty questions are not sent, and questions over the length limit are blocked
 * with a message telling the user the limit.
 * @param onSubmit - Called with the trimmed question when the user sends it.
 * @param disabled - Stops sending while waiting for the server to reply.
 */
export function QuestionInput({ onSubmit, disabled = false }: QuestionInputProps) {
  const [question, setQuestion] = useState("");

  const trimmed = question.trim();
  const tooLong = trimmed.length > MAX_QUESTION_LENGTH;
  const canSend = trimmed.length > 0 && !tooLong && !disabled;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    onSubmit(trimmed);
    setQuestion("");
  }

  return (
    <form className="question-input" onSubmit={handleSubmit}>
      <label htmlFor="question">Ask your own question</label>
      <input
        id="question"
        type="text"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        disabled={disabled}
        aria-describedby="question-hint"
        autoComplete="off"
      />
      <p id="question-hint" className={tooLong ? "question-input__hint--error" : "question-input__hint"}>
        {tooLong
          ? `Your question is too long. Please keep it to ${MAX_QUESTION_LENGTH} characters or fewer.`
          : `${trimmed.length}/${MAX_QUESTION_LENGTH}`}
      </p>
      <button type="submit" disabled={!canSend}>
        Send
      </button>
    </form>
  );
}
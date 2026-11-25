import type { ChatMessage } from "../types/dialogue";

interface MessageListProps {
  messages: ChatMessage[];
}

/**
 * Shows the conversation so far, oldest message first.
 * New messages are announced to screen readers as they arrive.
 * @param messages - Every message from the user and Wheeler-Nicholson, in order.
 */
export function MessageList({ messages }: MessageListProps) {
  return (
    <ol className="message-list" role="log" aria-live="polite">
      {messages.map((message) => (
        <li key={message.id} className={`message message--${message.speaker}`}>
          <span className="message__speaker">
            {message.speaker === "mwn" ? "Wheeler-Nicholson" : "You"}
          </span>
          <p className="message__text">{message.text}</p>
        </li>
      ))}
    </ol>
  );
}
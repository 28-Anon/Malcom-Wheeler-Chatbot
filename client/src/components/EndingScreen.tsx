import type { ClientState, NodeView, TopicId } from "../types/dialogue";

/** Readable names for each topic, shown in the ending summary. */
const TOPIC_NAMES: Record<TopicId, string> = {
  intro: "Introduction",
  military: "Army career",
  pulps: "Pulp writing",
  founding: "Founding National Allied",
  downfall: "Losing the company",
  legacy: "Legacy",
  ending: "Ending",
};

interface EndingScreenProps {
  ending: NodeView;
  state: ClientState;
  onRestart: () => void;
}

/**
 * Shown when the conversation ends. Displays Wheeler-Nicholson's closing line,
 * the topics the user explored, and a button to start again.
 * @param ending - The final line of the conversation.
 * @param state - Session state, used to list the topics the user visited.
 * @param onRestart - Called when the user chooses to start a new conversation.
 */
export function EndingScreen({ ending, state, onRestart }: EndingScreenProps) {
  return (
    <section className="ending-screen" aria-labelledby="ending-title">
      <h2 id="ending-title">The interview is over</h2>
      <p className="ending-screen__line">{ending.text}</p>

      <h3>Topics you explored</h3>
      {state.topicsVisited.length > 0 ? (
        <ul>
          {state.topicsVisited.map((topic) => (
            <li key={topic}>{TOPIC_NAMES[topic]}</li>
          ))}
        </ul>
      ) : (
        <p>You did not explore any topics this time.</p>
      )}

      <button type="button" onClick={onRestart}>
        Start a new conversation
      </button>
    </section>
  );
}
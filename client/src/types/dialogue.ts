/** Moods Wheeler-Nicholson can be in, shown in the UI. */
export type Mood = "neutral" | "proud" | "warm" | "bitter" | "guarded" | "amused" | "angry";

/** Topic IDs used across the conversation. */
export type TopicId = "intro" | "military" | "pulps" | "founding" | "downfall" | "legacy" | "ending";

/** The line Wheeler-Nicholson is currently saying. */
export interface NodeView {
  id: string;
  text: string;
  mood: Mood;
  type: "line" | "hub" | "ending";
}

/** A reply the user can pick. Only the id and text are sent to the client. */
export interface ChoiceView {
  id: string;
  text: string;
}

/** The parts of the session state the frontend is allowed to see. */
export interface ClientState {
  rapport: number;
  topicsVisited: TopicId[];
  topicsUnlocked: TopicId[];
  ended: boolean;
}

/** What the server returns after every action. */
export interface DialogueResponse {
  node: NodeView;
  choices: ChoiceView[];
  state: ClientState;
}
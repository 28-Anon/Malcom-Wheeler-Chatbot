import type { DialogueResponse } from "../types/dialogue";

/** Placeholder opening response, used until the real session endpoint exists. */
export const mockStart: DialogueResponse = {
  node: {
    id: "intro_01",
    text: "Major Malcolm Wheeler-Nicholson, at your service. Sit down. What would you like to know?",
    mood: "neutral",
    type: "hub",
  },
  choices: [
    { id: "a", text: "Tell me about your time in the Army." },
    { id: "b", text: "How did you get into publishing?" },
    { id: "c", text: "What happened to your company?" },
  ],
  state: {
    rapport: 50,
    topicsVisited: [],
    topicsUnlocked: ["military", "pulps", "founding"],
    ended: false,
  },
};

/** Placeholder ending response, used to build the ending screen. */
export const mockEnding: DialogueResponse = {
  node: {
    id: "ending_01",
    text: "Well, that is enough of an old soldier's stories for one day. Thank you for listening. Not many people ask about me these days.",
    mood: "warm",
    type: "ending",
  },
  choices: [],
  state: {
    rapport: 75,
    topicsVisited: ["military", "founding", "downfall"],
    topicsUnlocked: ["military", "pulps", "founding", "downfall", "legacy"],
    ended: true,
  },
};
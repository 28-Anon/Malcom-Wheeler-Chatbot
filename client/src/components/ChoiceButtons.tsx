import type { ChoiceView } from "../types/dialogue";

interface ChoiceButtonsProps {
  choices: ChoiceView[];
  onChoose: (choiceId: string) => void;
  disabled?: boolean;
}

/**
 * Shows the replies the user can pick, one button per choice.
 * @param choices - Replies available for the current line.
 * @param onChoose - Called with the choice's id when its button is clicked.
 * @param disabled - Stops clicks while waiting for the server to reply.
 */
export function ChoiceButtons({ choices, onChoose, disabled = false }: ChoiceButtonsProps) {
  if (choices.length === 0) {
    return null;
  }

  return (
    <div className="choice-buttons">
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => onChoose(choice.id)}
          disabled={disabled}
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
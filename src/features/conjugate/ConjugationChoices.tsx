"use client";

import QuestionCard from "../../components/QuestionCard";
import { CheckIcon, XIcon } from "../../components/icons";
import type { Tense, VerbConjugation } from "../../languages/types";
import ConjugationPrompt from "./ConjugationPrompt";

type ConjugationChoicesProps = {
  randomVerb: VerbConjugation | null;
  tenseLabels: Record<Tense, string>;
  // null while a question's choices are still loading (or before the first
  // question has been fetched at all) -- renders a skeleton row instead of
  // real buttons.
  choices: string[] | null;
  // The option the user tapped this question, right or wrong -- once set,
  // every button locks and the correct one is highlighted. There's no retry:
  // a pick (either way) is the whole answer, and the parent auto-advances to
  // the next verb shortly after.
  selectedChoice: string | null;
  onSelectChoice: (choice: string) => void;
  questionKey: number;
};

const ConjugationChoices = ({
  randomVerb,
  tenseLabels,
  choices,
  selectedChoice,
  onSelectChoice,
  questionKey,
}: ConjugationChoicesProps) => {
  const isResolved = selectedChoice !== null;
  const wasCorrectPick = selectedChoice === randomVerb?.form_target;

  return (
    <QuestionCard animationKey={questionKey}>
      <ConjugationPrompt randomVerb={randomVerb} tenseLabels={tenseLabels} />

      <div className="quiz-choices" role="group" aria-label="Answer choices">
        {choices
          ? choices.map((choice) => {
              // The correct button lights up once resolved regardless of
              // which one was picked -- a wrong pick still shows what the
              // right answer was before moving on.
              const isThisCorrect = isResolved && choice === randomVerb?.form_target;
              const isThisWrongPick = choice === selectedChoice && !wasCorrectPick;
              const stateClass = isThisCorrect ? " correct" : isThisWrongPick ? " incorrect" : "";
              return (
                <button
                  key={choice}
                  type="button"
                  className={`quiz-choice${stateClass}`}
                  disabled={isResolved}
                  onClick={() => onSelectChoice(choice)}
                >
                  <span>{choice}</span>
                  {isThisCorrect && (
                    <span className="quiz-choice-icon" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  )}
                  {isThisWrongPick && (
                    <span className="quiz-choice-icon" aria-hidden="true">
                      <XIcon />
                    </span>
                  )}
                </button>
              );
            })
          : Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="quiz-choice quiz-choice--skeleton" aria-hidden="true" />
            ))}
      </div>
      <span className="sr-only" role="status">
        {isResolved ? (wasCorrectPick ? "Correct!" : "Incorrect") : ""}
      </span>
    </QuestionCard>
  );
};

export default ConjugationChoices;

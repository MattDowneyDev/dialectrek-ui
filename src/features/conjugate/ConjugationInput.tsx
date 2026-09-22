"use client";

import { useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import Button from "../../components/Button";
import QuestionCard from "../../components/QuestionCard";
import { CheckIcon, XIcon } from "../../components/icons";
import type { Tense, VerbConjugation } from "../../languages/types";
import ConjugationPrompt from "./ConjugationPrompt";
import ConjugationHintArea from "./ConjugationHintArea";

type ConjugationInputProps = {
  randomVerb: VerbConjugation | null;
  tenseLabels: Record<Tense, string>;
  accentChars: string[];
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSubmitGuess: (event: FormEvent<HTMLFormElement>) => void;
  isCorrectAnswer: string;
  fetchRandomVerbConjugation: () => void;
  userGuess: string;
  showHint: boolean;
  onShowHint: () => void;
  showAnswer: boolean;
  onShowAnswer: () => void;
  questionKey: number;
};

const ConjugationInput = ({
  randomVerb,
  tenseLabels,
  accentChars,
  handleInputChange,
  handleSubmitGuess,
  isCorrectAnswer,
  fetchRandomVerbConjugation,
  userGuess,
  showHint,
  onShowHint,
  showAnswer,
  onShowAnswer,
  questionKey,
}: ConjugationInputProps) => {
  const isCorrect = isCorrectAnswer === "true";
  const isLocked = isCorrect || showAnswer;
  const inputStateClass =
    isCorrectAnswer === "true"
      ? " correct"
      : isCorrectAnswer === "false"
        ? " incorrect"
        : "";

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [randomVerb, isCorrect]);

  const insertChar = (char: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? userGuess.length;
    const end = input.selectionEnd ?? userGuess.length;
    input.value = userGuess.slice(0, start) + char + userGuess.slice(end);
    handleInputChange({ target: input } as ChangeEvent<HTMLInputElement>);

    const cursor = start + char.length;
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <QuestionCard animationKey={questionKey}>
      <ConjugationPrompt randomVerb={randomVerb} tenseLabels={tenseLabels} />

      <form onSubmit={handleSubmitGuess}>
        <div className="quiz-input-wrap">
          <input
            ref={inputRef}
            type="text"
            className={`quiz-input${inputStateClass}`}
            id="conjugationGuess"
            placeholder="Enter your translation"
            onChange={handleInputChange}
            value={userGuess}
            autoComplete="off"
            readOnly={isLocked}
          />
          {/* Replaces the old separate "Correct!"/"Incorrect" banner -- the
              result now reads right off the input it's about, instead of a
              second element the eye has to jump to. Purely decorative (the
              border color already carries the same signal); the sr-only
              status text below carries it for screen readers. */}
          {isCorrectAnswer !== "" && (
            <span
              className={`quiz-input-icon${isCorrect ? " correct" : " incorrect"}`}
              aria-hidden="true"
            >
              {isCorrect ? <CheckIcon /> : <XIcon />}
            </span>
          )}
        </div>
        <span className="sr-only" role="status">
          {isCorrectAnswer === "true"
            ? "Correct!"
            : isCorrectAnswer === "false"
              ? "Incorrect"
              : ""}
        </span>

        {/* Always mounted (visibility toggled, not conditionally rendered)
            so it keeps reserving its row's height even once locked --
            otherwise the card shrinks right as the hint text is trying to
            grow into that same space, and everything below the card
            visibly jumps. */}
        <div className={`accent-toolbar${isLocked ? " accent-toolbar--hidden" : ""}`}>
          {accentChars.map((char) => (
            <button
              key={char}
              type="button"
              className="accent-btn"
              tabIndex={-1}
              onClick={() => insertChar(char)}
            >
              {char}
            </button>
          ))}
        </div>

        {/* Show Hint/Show Answer stays available the whole time a question
            is open, not just after a miss -- someone who doesn't know a
            verb at all shouldn't have to submit a wrong guess first just to
            unlock it. Collapses down to just "Next Verb" once resolved. */}
        <div className="quiz-actions">
          {isCorrect || showAnswer ? (
            <Button variant="outline" onClick={() => fetchRandomVerbConjugation()}>
              Next Verb
            </Button>
          ) : (
            <>
              <Button type="submit">Check Answer</Button>
              <Button variant="ghost" onClick={showHint ? onShowAnswer : onShowHint}>
                {showHint ? "Show Answer" : "Show Hint"}
              </Button>
            </>
          )}
        </div>
      </form>

      <ConjugationHintArea randomVerb={randomVerb} showHint={showHint} showAnswer={showAnswer} />
    </QuestionCard>
  );
};

export default ConjugationInput;

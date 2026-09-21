"use client";

import { useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import Button from "../../components/Button";
import QuestionCard from "../../components/QuestionCard";
import { CheckIcon, XIcon } from "../../components/icons";
import type { Tense, VerbConjugation } from "../../languages/types";

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
      {(randomVerb?.tense || randomVerb?.mood) && (
        <div className="quiz-badges">
          {randomVerb?.tense && (
            <div className={`quiz-mood ${randomVerb.tense}`}>
              {tenseLabels[randomVerb.tense]}
            </div>
          )}
          {randomVerb?.tense === "imperative" && randomVerb?.polarity ? (
            <div className={`quiz-mood ${randomVerb.polarity}`}>
              {randomVerb.polarity === "negative"
                ? "Negative"
                : "Affirmative"}
            </div>
          ) : (
            randomVerb?.mood && (
              <div className={`quiz-mood ${randomVerb.mood}`}>
                {randomVerb.mood === "subjunctive"
                  ? "Subjunctive"
                  : "Indicative"}
              </div>
            )
          )}
        </div>
      )}
      <div className="quiz-sentence">
        {randomVerb?.mood === "subjunctive" &&
          randomVerb?.tense !== "imperative" && (
            <span className="quiz-subjunctive-marker">(that)</span>
          )}
        {randomVerb?.pronoun_english && (
          <span className="quiz-pronoun">{randomVerb.pronoun_english}</span>
        )}
        <span className="quiz-word">{randomVerb?.form_english ?? "..."}</span>
      </div>

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

      {/* Both lines are always mounted (visibility toggled, one overlaid on
          the other via CSS grid -- see .hint-area) rather than conditionally
          rendered, so the card reserves each one's real height from the
          start instead of a guessed value. Only ever one visible at a time:
          the answer already implies the hint, so there's no need to keep
          the hint line around once the answer is up. */}
      <div className="hint-area">
        <div className={`hint-text${showAnswer ? "" : " hint-text--hidden"}`}>
          {randomVerb?.form_target && (
            <>
              Answer: <strong>{randomVerb.form_target}</strong>
              {randomVerb.form_target_alt && (
                <>
                  {" "}
                  (or <strong>{randomVerb.form_target_alt}</strong>)
                </>
              )}
            </>
          )}
        </div>
        <div className={`hint-text${showHint && !showAnswer ? "" : " hint-text--hidden"}`}>
          {randomVerb?.infinitive_target && (
            <>
              Hint: the infinitive is <strong>{randomVerb.infinitive_target}</strong>
            </>
          )}
        </div>
      </div>
    </QuestionCard>
  );
};

export default ConjugationInput;

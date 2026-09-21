"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import GoalBar from "../../components/GoalBar";
import PracticeHistoryTable, {
  type PracticeHistoryRow,
} from "../../components/PracticeHistoryTable";
import CategorySelection, { formatCategory } from "./CategorySelection";
import { fetchRandomWord, fetchWordCategories } from "../../languages/api";
import type { LanguageDefinition } from "../../languages/registry";
import type { RandomWord } from "../../languages/types";
import {
  DEFAULT_FLASHCARDS_GOAL_SECONDS,
  persistDailyFlashcardsSeconds,
  persistFlashcardsGoalSeconds,
  readDailyFlashcardsSeconds,
  readFlashcardsGoalSeconds,
} from "./session";

type FlashcardsClientProps = {
  code: string;
  definition: LanguageDefinition;
};

type Direction = "target-to-english" | "english-to-target";

const FlashcardsClient = ({ code, definition }: FlashcardsClientProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null | undefined>(undefined);
  const [word, setWord] = useState<RandomWord | null>(null);
  const [direction, setDirection] = useState<Direction>("target-to-english");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlipHint, setShowFlipHint] = useState(true);
  // Newest-first log of every word answered this session, shown as a table
  // below the flashcard instead of a single running score tile.
  const [history, setHistory] = useState<PracticeHistoryRow[]>([]);
  // Counts up toward goalSeconds across the whole day (every practice visit
  // today, not just this one) -- only ticks while actively on the practice
  // screen (category chosen), same idea as Watch only ticking while a video
  // is playing. Persisted per calendar day (see readDailyFlashcardsSeconds),
  // so it survives a reload or a second tab today but resets once a new day
  // starts.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // The goal itself (unlike progress toward it) is a standing preference --
  // read from localStorage once mounted.
  const [goalSeconds, setGoalSeconds] = useState(DEFAULT_FLASHCARDS_GOAL_SECONDS);

  const loadNextWord = async () => {
    setIsLoading(true);
    setIsFlipped(false);
    const nextWord = await fetchRandomWord(code, category ?? undefined);
    setWord(nextWord ?? null);
    setIsLoading(false);
  };

  const toggleFlipped = () => {
    setShowFlipHint(false);
    setIsFlipped((flipped) => !flipped);
  };

  const handleSetDirection = (next: Direction) => {
    setDirection(next);
    setIsFlipped(false);
  };

  const recordHistory = (correct: boolean) => {
    if (!word) return;
    setHistory((prev) => [
      {
        id: crypto.randomUUID(),
        correct,
        cells: [word.word_target, word.word_english],
      },
      ...prev,
    ]);
  };

  const handleKnewIt = () => {
    recordHistory(true);
    loadNextWord();
  };

  const handleDidntKnowIt = () => {
    recordHistory(false);
    loadNextWord();
  };

  // GoalBar's onChangeTarget always passes a real number here -- allowNoLimit
  // is left off below, so "no limit" is never an option a viewer can pick.
  const handleChangeGoal = (minutes: number | null) => {
    if (minutes === null) return;
    const seconds = minutes * 60;
    setGoalSeconds(seconds);
    persistFlashcardsGoalSeconds(seconds);
  };

  useEffect(() => {
    let cancelled = false;
    setCategories([]);
    setCategory(undefined);

    (async () => {
      const list = await fetchWordCategories(code);
      if (!cancelled) setCategories(list);
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (category === undefined) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setIsFlipped(false);
      const nextWord = await fetchRandomWord(code, category ?? undefined);
      if (cancelled) return;
      setWord(nextWord ?? null);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [code, category]);

  // Picks up today's progress and the standing goal from a previous visit --
  // without this, both would start over at 0/default on every reload even
  // though the real totals are still sitting in localStorage.
  useEffect(() => {
    setGoalSeconds(readFlashcardsGoalSeconds());
    setElapsedSeconds(readDailyFlashcardsSeconds());
  }, []);

  const isSetupStep = category === undefined;

  useEffect(() => {
    if (isSetupStep) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSetupStep]);

  // Mirrors every tick to localStorage so today's progress survives a
  // reload. Skips its own very first (mount-time) run: elapsedSeconds still
  // holds its initial 0 at that point, since the read-from-storage effect
  // above only *schedules* the real value rather than applying it
  // immediately -- persisting on that first pass would momentarily clobber
  // today's real total with 0 the instant this component (re)mounts.
  const hasPersistedOnce = useRef(false);
  useEffect(() => {
    if (!hasPersistedOnce.current) {
      hasPersistedOnce.current = true;
      return;
    }
    persistDailyFlashcardsSeconds(elapsedSeconds);
  }, [elapsedSeconds]);

  return (
    <div className="page">
      <div className="goal-bar-wrap">
        <GoalBar
          elapsedSeconds={elapsedSeconds}
          targetSeconds={goalSeconds}
          onChangeTarget={handleChangeGoal}
          caption="Today's flashcards goal"
          editLabel="Change today's flashcards goal"
          subjectLabel="goal"
          completeLabel="Goal reached!"
          ctaLabel="Set a flashcards goal"
        />
      </div>

      <PageHeader
        title="Flashcards"
        subtitle={
          category
            ? `Flip through ${definition.displayName} words in the "${formatCategory(category)}" category.`
            : `Flip through the ${definition.wordCount} most common ${definition.displayName} words.`
        }
      />

      <div className={`flashcards-card${isSetupStep ? " flashcards-card--setup" : ""}`}>
        {isSetupStep ? (
          categories.length > 0 && (
            <CategorySelection categories={categories} onSelect={setCategory} />
          )
        ) : (
          <>
            <div className="direction-toggle">
              <button
                type="button"
                role="switch"
                aria-checked={direction === "english-to-target"}
                aria-label="Flashcard practice direction"
                className="lang-toggle"
                onClick={() =>
                  handleSetDirection(
                    direction === "target-to-english"
                      ? "english-to-target"
                      : "target-to-english",
                  )
                }
              >
                <span
                  className={`lang-toggle-thumb${
                    direction === "english-to-target" ? " right" : ""
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`lang-toggle-label${
                    direction === "target-to-english" ? " active" : ""
                  }`}
                >
                  {definition.displayName}
                </span>
                <span
                  className={`lang-toggle-label${
                    direction === "english-to-target" ? " active" : ""
                  }`}
                >
                  English
                </span>
              </button>
            </div>

            {word && (
              <div className="flashcard-wrap">
                {showFlipHint && (
                  <div className="flip-hint" aria-hidden="true">
                    <span className="flip-hint-bubble">Click to flip!</span>
                    <svg
                      className="flip-hint-arrow"
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 4V28"
                        stroke="var(--color-primary)"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M8 20L20 32L32 20"
                        stroke="var(--color-primary)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className={`flashcard${isFlipped ? " flipped" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={toggleFlipped}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleFlipped();
                    }
                  }}
                  aria-label="Flip flashcard"
                  key={word.rank}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-face flashcard-face--front">
                      <span className="flashcard-word">
                        {direction === "target-to-english"
                          ? word.word_target
                          : word.word_english}
                      </span>
                    </div>
                    <div className="flashcard-face flashcard-face--back">
                      <span className="flashcard-word">
                        {direction === "target-to-english"
                          ? word.word_english
                          : word.word_target}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!word && !isLoading && (
              <EmptyState>Couldn&apos;t load a word right now. Try again in a moment.</EmptyState>
            )}

            {/* Always mounted (visibility toggled, not conditionally
                rendered) so it keeps reserving its row's height whether the
                card is flipped or not -- otherwise the history table below
                jumps up and down every time a card flips. */}
            <div
              className={`flashcards-controls${isFlipped ? "" : " flashcards-controls--hidden"}`}
            >
              <Button
                variant="outline"
                onClick={handleDidntKnowIt}
                disabled={isLoading || !isFlipped}
              >
                I didn&apos;t know it
              </Button>
              <Button onClick={handleKnewIt} disabled={isLoading || !isFlipped}>
                I knew it
              </Button>
            </div>
          </>
        )}
      </div>

      <PracticeHistoryTable
        title="Words practiced"
        headers={["Word", "Translation"]}
        rows={history}
      />
    </div>
  );
};

export default FlashcardsClient;

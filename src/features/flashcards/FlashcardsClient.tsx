"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import FocusMode, { useFocusMode } from "../../components/FocusMode";
import GoalBar from "../../components/GoalBar";
import PracticeHistoryTable, {
  type PracticeHistoryRow,
} from "../../components/PracticeHistoryTable";
import CategorySelection from "./CategorySelection";
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
  const [categorySelection, setCategorySelection] = useState<string[]>([]);
  // Flips the setup screen over to practice mode -- set by "Let's go!",
  // cleared again once a fresh session starts from the category screen.
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [word, setWord] = useState<RandomWord | null>(null);
  const [direction, setDirection] = useState<Direction>("target-to-english");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlipHint, setShowFlipHint] = useState(true);
  // Newest-first log of every word answered this session, shown as a table
  // on the summary screen once the session is stopped.
  const [history, setHistory] = useState<PracticeHistoryRow[]>([]);
  // Flips practice mode over to the summary screen -- set by the "Stop"
  // button, cleared again once a fresh session starts from the category
  // screen.
  const [isSessionSummary, setIsSessionSummary] = useState(false);
  // Counts up toward goalSeconds across the whole day (every practice visit
  // today, not just this one) -- only ticks while actively on the practice
  // screen (category chosen), same idea as Watch only ticking while a video
  // is playing. Persisted per calendar day (see readDailyFlashcardsSeconds),
  // so it survives a reload or a second tab today but resets once a new day
  // starts.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // The goal itself (unlike progress toward it) is a standing preference --
  // read from localStorage once mounted.
  const [goalSeconds, setGoalSeconds] = useState(
    DEFAULT_FLASHCARDS_GOAL_SECONDS,
  );

  // Mirrors Conjugate's resolveTense -- picks uniformly among whichever
  // categories are currently selected, rather than weighting by how many
  // words each one actually has.
  const resolveCategory = () =>
    categorySelection[Math.floor(Math.random() * categorySelection.length)];

  const loadNextWord = async () => {
    setIsLoading(true);
    setIsFlipped(false);
    const nextWord = await fetchRandomWord(code, resolveCategory());
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

  const handleToggleCategory = (category: string) => {
    setCategorySelection((prev) =>
      prev.includes(category) ? prev.filter((selected) => selected !== category) : [...prev, category],
    );
  };

  const handleToggleAllCategories = () => {
    setCategorySelection((prev) => (prev.length === categories.length ? [] : categories));
  };

  const handleConfirmCategories = () => {
    // Pushes a same-page history entry so the browser's back button steps
    // out of practice mode back to this category screen instead of leaving
    // the page entirely -- see the popstate listener below. Skipped when
    // we're already sitting on that pushed entry (e.g. re-confirming after
    // "Choose different categories" without ever pressing back in between)
    // so repeated sessions in one visit don't pile up redundant entries.
    if (!window.history.state?.flashcardsPractice) {
      window.history.pushState({ flashcardsPractice: true }, "");
    }
    setIsConfirmed(true);
    loadNextWord();
  };

  const handleStop = () => setIsSessionSummary(true);

  const handleChooseAnotherCategory = () => {
    setIsConfirmed(false);
    setIsSessionSummary(false);
    setHistory([]);
    setCategorySelection([]);
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
    setCategorySelection([]);
    setIsConfirmed(false);

    (async () => {
      const list = await fetchWordCategories(code);
      if (!cancelled) setCategories(list);
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  // Picks up today's progress and the standing goal from a previous visit --
  // without this, both would start over at 0/default on every reload even
  // though the real totals are still sitting in localStorage.
  useEffect(() => {
    setGoalSeconds(readFlashcardsGoalSeconds());
    setElapsedSeconds(readDailyFlashcardsSeconds());
  }, []);

  // Answers the back button while practicing (or reviewing the session
  // summary) by dropping back to the category screen, rather than leaving
  // the page -- pairs with the pushState in handleConfirmCategories. A
  // popstate here always means "landed back on the pre-practice entry", so
  // it resets unconditionally rather than inspecting event.state.
  useEffect(() => {
    const handlePopState = () => {
      setIsConfirmed(false);
      setIsSessionSummary(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isSetupStep = !isConfirmed;
  const isSummaryStep = !isSetupStep && isSessionSummary;
  const isPracticeStep = !isSetupStep && !isSessionSummary;

  // Practice mode takes over the whole screen like a modal -- the site
  // header/footer would just be distractions (and dead space to scroll
  // past) while a viewer is heads-down flipping through cards, so they're
  // hidden for as long as this step is active (see useFocusMode).
  useFocusMode(isPracticeStep);

  useEffect(() => {
    if (!isPracticeStep) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPracticeStep]);

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

  const correctCount = history.filter((row) => row.correct).length;

  return (
    <div className="page">
      {isSetupStep && (
        <>
          <PageHeader
            title="Flashcards"
            subtitle={`Flip through the ${definition.wordCount} most common ${definition.displayName} words.`}
          />
          <div className="flashcards-card flashcards-card--setup">
            {categories.length > 0 && (
              <CategorySelection
                categories={categories}
                categorySelection={categorySelection}
                onToggleCategory={handleToggleCategory}
                onToggleAllCategories={handleToggleAllCategories}
                onConfirm={handleConfirmCategories}
              />
            )}
          </div>
        </>
      )}

      {isPracticeStep && (
        <FocusMode>
          <div className="focus-mode-meter">
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

          <div className="focus-mode-body">
            <div className="focus-mode-stage">
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
                <EmptyState>
                  Couldn&apos;t load a word right now. Try again in a moment.
                </EmptyState>
              )}
            </div>

            <div className="focus-mode-panel">
              <div className="focus-mode-panel-content">
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

                {/* Always mounted (visibility toggled, not conditionally
                    rendered) so it keeps reserving its row's height whether
                    the card is flipped or not -- otherwise everything below
                    it jumps up and down every time a card flips. */}
                <div
                  className={`flashcards-controls${isFlipped ? "" : " flashcards-controls--hidden"}`}
                >
                  <Button
                    onClick={handleKnewIt}
                    disabled={isLoading || !isFlipped}
                  >
                    I knew it
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDidntKnowIt}
                    disabled={isLoading || !isFlipped}
                  >
                    I didn&apos;t know it
                  </Button>
                </div>

                <Button variant="ghost" onClick={handleStop}>
                  Stop practice
                </Button>
              </div>
            </div>
          </div>
        </FocusMode>
      )}

      {isSummaryStep && (
        <>
          <PageHeader
            title="Session summary"
            subtitle={
              history.length > 0
                ? `You got ${correctCount} right out of ${history.length} (${Math.round(
                    (correctCount / history.length) * 100,
                  )}%).`
                : "You stopped before reviewing any words this session."
            }
          />
          <PracticeHistoryTable
            headers={["Word", "Translation"]}
            rows={history}
          />
          <div className="summary-actions">
            <Button onClick={handleChooseAnotherCategory}>Practice again</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default FlashcardsClient;

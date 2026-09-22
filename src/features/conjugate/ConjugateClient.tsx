"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import FocusMode, { useFocusMode } from "../../components/FocusMode";
import GoalBar from "../../components/GoalBar";
import PracticeHistoryTable, {
  type PracticeHistoryRow,
} from "../../components/PracticeHistoryTable";
import VerbTypeSelection from "./VerbTypeSelection";
import MoodSelection, { type MoodChoice } from "./MoodSelection";
import TenseSelection from "./TenseSelection";
import ConjugationInput from "./ConjugationInput";
import { fetchRandomVerbConjugation as fetchVerb } from "../../languages/api";
import type { LanguageDefinition } from "../../languages/registry";
import type { Mood, Polarity, Tense, VerbConjugation } from "../../languages/types";
import {
  DEFAULT_CONJUGATE_GOAL_SECONDS,
  persistConjugateGoalSeconds,
  persistDailyConjugateSeconds,
  readConjugateGoalSeconds,
  readDailyConjugateSeconds,
} from "./session";

// The imperative doesn't have indicative/subjunctive forms -- it has
// affirmative/negative ones instead, resolved by resolvePolarity below.
// Universal across languages, so it isn't part of per-language config.
const IMPERATIVE_TENSE: Tense = "imperative";

type SetupStep =
  | { kind: "irregular" }
  | { kind: "toggle"; key: string; prompt: string }
  | { kind: "subjunctive" }
  | { kind: "tenses" };

type ConjugateClientProps = {
  code: string;
  definition: LanguageDefinition;
  // Pre-checks these on the tense-selection step (e.g. arriving from a
  // grammar topic's "practice these tenses" link) -- the user still
  // confirms the step themselves rather than skipping straight past it.
  initialTenses?: Tense[];
};

const ConjugateClient = ({ code, definition, initialTenses }: ConjugateClientProps) => {
  const tenseList = useMemo(() => definition.availableTenses, [definition]);
  const steps = useMemo<SetupStep[]>(
    () => [
      { kind: "irregular" },
      ...definition.extraToggles.map((toggle) => ({
        kind: "toggle" as const,
        key: toggle.key,
        prompt: toggle.prompt,
      })),
      ...(definition.hasSubjunctive ? [{ kind: "subjunctive" as const }] : []),
      { kind: "tenses" },
    ],
    [definition],
  );

  // Arriving with tenses already picked (from a grammar topic's practice
  // link) skips the setup wizard entirely rather than just pre-checking
  // the tense step -- indicative mood, irregular verbs on, regional
  // variants off, straight into the first question.
  const skipSetup = (initialTenses?.length ?? 0) > 0;

  const [useIrregularVerbs, setUseIrregularVerbs] = useState<boolean | undefined>(
    skipSetup ? true : undefined,
  );
  const [toggleAnswers, setToggleAnswers] = useState<Record<string, boolean>>(() =>
    skipSetup
      ? Object.fromEntries(definition.extraToggles.map((toggle) => [toggle.key, false]))
      : {},
  );
  const [moodSelection, setMoodSelection] = useState<MoodChoice | undefined>(
    skipSetup ? "indicative" : undefined,
  );
  const [tenseSelection, setTenseSelection] = useState<Tense[]>(initialTenses ?? []);
  const [randomVerb, setRandomVerb] = useState<VerbConjugation | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(() => (skipSetup ? steps.length : 0));
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<string>("");
  const [userGuess, setUserGuess] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  // Identifies which verb is currently on screen, for ConjugationInput's
  // animationKey.
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  // Newest-first log of every verb answered this session, shown as a table
  // on the summary screen once the session is stopped.
  const [history, setHistory] = useState<PracticeHistoryRow[]>([]);
  // Flips practice mode over to the summary screen -- set by the "Stop"
  // button, cleared again once a fresh session starts from the setup
  // wizard.
  const [isSessionSummary, setIsSessionSummary] = useState(false);
  // Counts up toward goalSeconds across the whole day (every practice visit
  // today, not just this one) -- only ticks while actively conjugating
  // (setup wizard finished), same idea as Watch only ticking while a video
  // is playing. Persisted per calendar day (see readDailyConjugateSeconds),
  // so it survives a reload or a second tab today but resets once a new day
  // starts.
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  // The goal itself (unlike progress toward it) is a standing preference --
  // read from localStorage once mounted.
  const [goalSeconds, setGoalSeconds] = useState<number>(DEFAULT_CONJUGATE_GOAL_SECONDS);

  const isActiveConjugation = stepIndex === steps.length && !isSessionSummary;
  const isSummaryStep = stepIndex === steps.length && isSessionSummary;

  // Practice mode takes over the whole screen like a modal -- see
  // useFocusMode (shared with Flashcards' practice screen).
  useFocusMode(isActiveConjugation);

  // Picks up today's progress and the standing goal from a previous visit --
  // without this, both would start over at 0/default on every reload even
  // though the real totals are still sitting in localStorage.
  useEffect(() => {
    setGoalSeconds(readConjugateGoalSeconds());
    setElapsedSeconds(readDailyConjugateSeconds());
  }, []);

  useEffect(() => {
    if (!isActiveConjugation) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActiveConjugation]);

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
    persistDailyConjugateSeconds(elapsedSeconds);
  }, [elapsedSeconds]);

  useEffect(() => {
    if (skipSetup) {
      fetchRandomVerbConjugation();
    }
    // Only ever runs once, on mount -- the initial setup state it reads
    // (irregular verbs, mood, tenses) doesn't change afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIrregularityQuestion = (userResponse: boolean) => {
    setUseIrregularVerbs(userResponse);
    setStepIndex((i) => i + 1);
  };

  const handleToggleAnswer = (key: string, userResponse: boolean) => {
    setToggleAnswers((prev) => ({ ...prev, [key]: userResponse }));
    setStepIndex((i) => i + 1);
  };

  const handleMoodSelection = (choice: MoodChoice) => {
    setMoodSelection(choice);
    setStepIndex((i) => i + 1);
  };

  const handleToggleTense = (tense: Tense) => {
    setTenseSelection((prev) =>
      prev.includes(tense)
        ? prev.filter((selected) => selected !== tense)
        : [...prev, tense],
    );
  };

  const handleToggleAllTenses = () => {
    setTenseSelection((prev) => (prev.length === tenseList.length ? [] : tenseList));
  };

  const handleTenseConfirm = () => {
    fetchRandomVerbConjugation();
  };

  const handleStop = () => setIsSessionSummary(true);

  // Resets every setup choice back to its pre-wizard state, same as a
  // fresh mount without initialTenses -- "practice again" always walks the
  // full wizard again, even if this session originally skipped it.
  const handlePracticeAgain = () => {
    setStepIndex(0);
    setIsSessionSummary(false);
    setHistory([]);
    setUseIrregularVerbs(undefined);
    setToggleAnswers({});
    setMoodSelection(undefined);
    setTenseSelection([]);
    setRandomVerb(null);
    setIsCorrectAnswer("");
    setUserGuess("");
    setShowHint(false);
    setShowAnswer(false);
  };

  // GoalBar's onChangeTarget always passes a real number here -- allowNoLimit
  // is left off below, so "no limit" is never an option a viewer can pick.
  const handleChangeGoal = (minutes: number | null) => {
    if (minutes === null) return;
    const seconds = minutes * 60;
    setGoalSeconds(seconds);
    persistConjugateGoalSeconds(seconds);
  };

  const resolveTense = (): Tense =>
    tenseSelection[Math.floor(Math.random() * tenseSelection.length)];

  const resolveMood = (resolvedTense: Tense): Mood => {
    // Tenses with no subjunctive form in this language always use the
    // indicative, and so does the imperative, which doesn't have a mood
    // axis at all -- regardless of what the user picked during setup.
    if (
      definition.indicativeOnlyTenses.includes(resolvedTense) ||
      resolvedTense === IMPERATIVE_TENSE
    ) {
      return "indicative";
    }
    if (moodSelection === "both") {
      return Math.random() < 0.5 ? "indicative" : "subjunctive";
    }
    return moodSelection === "subjunctive" ? "subjunctive" : "indicative";
  };

  const resolvePolarity = (resolvedTense: Tense): Polarity => {
    // Polarity only means anything for the imperative -- the backend
    // ignores it for every other tense, so the exact value here
    // doesn't matter when resolvedTense isn't "imperative".
    if (resolvedTense !== IMPERATIVE_TENSE) {
      return "affirmative";
    }
    return Math.random() < 0.5 ? "affirmative" : "negative";
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserGuess(event.target.value);
    if (isCorrectAnswer === "false") {
      setIsCorrectAnswer("");
    }
  };

  const recordHistory = (correct: boolean) => {
    if (!randomVerb) return;
    setHistory((prev) => [
      {
        id: crypto.randomUUID(),
        correct,
        cells: [
          randomVerb.infinitive_target ?? "",
          randomVerb.pronoun_english ?? "",
          randomVerb.tense ? definition.tenseLabels[randomVerb.tense] : "",
          randomVerb.form_target ?? "",
        ],
      },
      ...prev,
    ]);
  };

  const handleSubmitGuess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCorrectAnswer === "true") {
      fetchRandomVerbConjugation();
      return;
    }

    if (showAnswer) {
      return;
    }

    const normalizedGuess = userGuess.trim().toLowerCase();
    const correct =
      normalizedGuess === randomVerb?.form_target?.trim().toLowerCase() ||
      (!!randomVerb?.form_target_alt &&
        normalizedGuess === randomVerb.form_target_alt.trim().toLowerCase());
    setIsCorrectAnswer(correct ? "true" : "false");
    if (correct) {
      recordHistory(true);
    }
  };

  // Giving up (rather than answering correctly) also resolves the question
  // -- logs it right away instead of waiting for "Next Verb", same as a
  // correct guess does in handleSubmitGuess.
  const handleShowAnswer = () => {
    setShowAnswer(true);
    recordHistory(false);
  };

  const fetchRandomVerbConjugation = async () => {
    const tense = resolveTense();
    const verb = await fetchVerb(
      code,
      useIrregularVerbs,
      toggleAnswers["useRegionalVariant"],
      resolveMood(tense),
      tense,
      resolvePolarity(tense),
    );
    setRandomVerb(verb ?? null);
    setStepIndex(steps.length);
    setIsCorrectAnswer("");
    setUserGuess("");
    setShowHint(false);
    setShowAnswer(false);
    setQuestionIndex((prev) => prev + 1);
  };

  const isSetupStep = stepIndex < steps.length;
  const currentStep = isSetupStep ? steps[stepIndex] : null;
  const correctCount = history.filter((row) => row.correct).length;

  return (
    <div className="page">
      {isSetupStep && (
        <>
          <PageHeader
            title="Conjugate"
            subtitle={`Practice conjugating the ${definition.verbCount} most common ${definition.displayName} verbs.`}
          />

          <div
            className={`practice-card${currentStep?.kind === "tenses" ? " practice-card--tenses" : ""}`}
          >
            <div className="step-progress">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`step-dot${
                    index === stepIndex
                      ? " active"
                      : index < stepIndex
                        ? " done"
                        : ""
                  }`}
                />
              ))}
            </div>

            {currentStep?.kind === "irregular" && (
              <VerbTypeSelection
                prompt="Do you want irregular verbs?"
                onYes={() => handleIrregularityQuestion(true)}
                onNo={() => handleIrregularityQuestion(false)}
              />
            )}

            {currentStep?.kind === "toggle" && (
              <VerbTypeSelection
                prompt={currentStep.prompt}
                onYes={() => handleToggleAnswer(currentStep.key, true)}
                onNo={() => handleToggleAnswer(currentStep.key, false)}
              />
            )}

            {currentStep?.kind === "subjunctive" && (
              <MoodSelection onSelect={handleMoodSelection} />
            )}

            {currentStep?.kind === "tenses" && (
              <TenseSelection
                tenseList={tenseList}
                tenseLabels={definition.tenseLabels}
                tenseExamples={definition.tenseExamples}
                tenseSelection={tenseSelection}
                onToggleTense={handleToggleTense}
                onToggleAllTenses={handleToggleAllTenses}
                onConfirm={handleTenseConfirm}
              />
            )}
          </div>
        </>
      )}

      {isActiveConjugation && (
        <FocusMode>
          <div className="focus-mode-meter">
            <GoalBar
              elapsedSeconds={elapsedSeconds}
              targetSeconds={goalSeconds}
              onChangeTarget={handleChangeGoal}
              caption="Today's conjugate goal"
              editLabel="Change today's conjugate goal"
              subjectLabel="goal"
              completeLabel="Goal reached!"
              ctaLabel="Set a conjugate goal"
            />
          </div>

          <div className="focus-mode-body focus-mode-body--stacked">
            <div className="focus-mode-stage">
              <div className="conjugate-focus-card">
                <ConjugationInput
                  randomVerb={randomVerb}
                  tenseLabels={definition.tenseLabels}
                  accentChars={definition.accentChars}
                  handleInputChange={handleInputChange}
                  handleSubmitGuess={handleSubmitGuess}
                  isCorrectAnswer={isCorrectAnswer}
                  fetchRandomVerbConjugation={fetchRandomVerbConjugation}
                  userGuess={userGuess}
                  showHint={showHint}
                  onShowHint={() => setShowHint(true)}
                  showAnswer={showAnswer}
                  onShowAnswer={handleShowAnswer}
                  questionKey={questionIndex}
                />
              </div>
            </div>

            <Button variant="ghost" onClick={handleStop}>
              Stop practice
            </Button>
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
                : "You stopped before answering any verbs this session."
            }
          />
          <PracticeHistoryTable
            headers={["Verb", "Pronoun", "Tense", "Answer"]}
            rows={history}
          />
          <div className="summary-actions">
            <Button onClick={handlePracticeAgain}>Practice again</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ConjugateClient;

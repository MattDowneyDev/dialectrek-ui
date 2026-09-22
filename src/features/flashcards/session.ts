import {
  persistDailyProgressSeconds,
  persistGoalSeconds,
  readDailyProgressSeconds,
  readGoalSeconds,
} from "../../lib/dailyGoal";

const FLASHCARDS_GOAL_SECONDS_KEY = "dialectrek-flashcards-goal-seconds";
const DAILY_FLASHCARDS_PROGRESS_KEY = "dialectrek-flashcards-daily-progress";

// The goal itself is a standing preference (so choosing "20 minutes" sticks
// for next time), independent of the daily progress toward it, which resets
// on its own each day (see readDailyFlashcardsSeconds/persistDailyFlashcardsSeconds).
export const DEFAULT_FLASHCARDS_GOAL_SECONDS = 300;

export const readFlashcardsGoalSeconds = (): number =>
  readGoalSeconds(FLASHCARDS_GOAL_SECONDS_KEY, DEFAULT_FLASHCARDS_GOAL_SECONDS);

export const persistFlashcardsGoalSeconds = (seconds: number) =>
  persistGoalSeconds(FLASHCARDS_GOAL_SECONDS_KEY, seconds);

export const readDailyFlashcardsSeconds = (): number =>
  readDailyProgressSeconds(DAILY_FLASHCARDS_PROGRESS_KEY);

export const persistDailyFlashcardsSeconds = (seconds: number) =>
  persistDailyProgressSeconds(DAILY_FLASHCARDS_PROGRESS_KEY, seconds);

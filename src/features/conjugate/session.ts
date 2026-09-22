import {
  persistDailyProgressSeconds,
  persistGoalSeconds,
  readDailyProgressSeconds,
  readGoalSeconds,
} from "../../lib/dailyGoal";

const CONJUGATE_GOAL_SECONDS_KEY = "dialectrek-conjugate-goal-seconds";
const DAILY_CONJUGATE_PROGRESS_KEY = "dialectrek-conjugate-daily-progress";

// The goal itself is a standing preference (so choosing "20 minutes" sticks
// for next time), independent of the daily progress toward it, which resets
// on its own each day (see readDailyConjugateSeconds/persistDailyConjugateSeconds).
export const DEFAULT_CONJUGATE_GOAL_SECONDS = 600;

export const readConjugateGoalSeconds = (): number =>
  readGoalSeconds(CONJUGATE_GOAL_SECONDS_KEY, DEFAULT_CONJUGATE_GOAL_SECONDS);

export const persistConjugateGoalSeconds = (seconds: number) =>
  persistGoalSeconds(CONJUGATE_GOAL_SECONDS_KEY, seconds);

export const readDailyConjugateSeconds = (): number =>
  readDailyProgressSeconds(DAILY_CONJUGATE_PROGRESS_KEY);

export const persistDailyConjugateSeconds = (seconds: number) =>
  persistDailyProgressSeconds(DAILY_CONJUGATE_PROGRESS_KEY, seconds);

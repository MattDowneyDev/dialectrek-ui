import {
  persistDailyProgressSeconds,
  persistGoalSeconds,
  readDailyProgressSeconds,
  readGoalSeconds,
  todayDateString,
} from "../../lib/dailyGoal";

const STORAGE_KEY = "dialectrek-watch-session-id";
const LIKED_IDS_KEY = "dialectrek-watch-liked-ids";
const DISLIKED_IDS_KEY = "dialectrek-watch-disliked-ids";
const WATCH_GOAL_SECONDS_KEY = "dialectrek-watch-goal-seconds";
const DAILY_WATCH_PROGRESS_KEY = "dialectrek-watch-daily-progress";
const WATCH_INTRO_SEEN_KEY = "dialectrek-watch-intro-seen";

// The ranking explainer only stays dismissed for the rest of today, same
// reset as the daily goal progress above -- shared by the auto-popup
// (WatchIntroModal) and the on-demand "how rankings work" button
// (WatchHelpButton), so dismissing either one suppresses both for today.
export const hasSeenWatchIntroToday = (): boolean =>
  window.localStorage.getItem(WATCH_INTRO_SEEN_KEY) === todayDateString();

export const markWatchIntroSeenToday = () => {
  window.localStorage.setItem(WATCH_INTRO_SEEN_KEY, todayDateString());
};

// The goal itself is a standing preference (so choosing "15 minutes" sticks
// for next time), independent of the daily progress toward it, which resets
// on its own each day (see readDailyWatchSeconds/persistDailyWatchSeconds).
export const DEFAULT_WATCH_GOAL_SECONDS = 1800;

export const readWatchGoalSeconds = (): number =>
  readGoalSeconds(WATCH_GOAL_SECONDS_KEY, DEFAULT_WATCH_GOAL_SECONDS);

export const persistWatchGoalSeconds = (seconds: number) =>
  persistGoalSeconds(WATCH_GOAL_SECONDS_KEY, seconds);

export const readDailyWatchSeconds = (): number =>
  readDailyProgressSeconds(DAILY_WATCH_PROGRESS_KEY);

export const persistDailyWatchSeconds = (seconds: number) =>
  persistDailyProgressSeconds(DAILY_WATCH_PROGRESS_KEY, seconds);

// A random id scoped to this browser, used only to dedupe one viewer's
// likes/votes on the backend (see watch.py) -- not an account, just enough
// to stop the same browser from liking a video twice.
export const getSessionId = (): string => {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
};

const readIdSet = (key: string): Set<string> => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const writeIdSet = (key: string, ids: Set<string>) => {
  window.localStorage.setItem(key, JSON.stringify([...ids]));
};

// The backend tracks like/dislike state per session id, not per page load
// (see toggle_like/toggle_dislike in watch.py) -- without mirroring that in
// localStorage too, a reload or a new tab would forget which videos this
// browser already voted on, show the button as un-toggled, and then flip
// the vote the wrong way the next time it's clicked.
export const readLikedIds = (): Set<string> => readIdSet(LIKED_IDS_KEY);
export const persistLikedIds = (ids: Set<string>) => writeIdSet(LIKED_IDS_KEY, ids);
export const readDislikedIds = (): Set<string> => readIdSet(DISLIKED_IDS_KEY);
export const persistDislikedIds = (ids: Set<string>) => writeIdSet(DISLIKED_IDS_KEY, ids);

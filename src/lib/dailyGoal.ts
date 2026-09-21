// Shared storage helpers behind every feature's daily goal bar (Watch,
// Flashcards, Conjugate) -- a standing goal (in seconds) that persists
// indefinitely, plus progress toward it that resets each calendar day.
// Each feature owns its own localStorage keys and calls these generically.

// Local (not UTC) calendar date, so a goal resets when the viewer's own day
// rolls over rather than at a UTC boundary that could land in the middle of
// their afternoon.
export const todayDateString = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export const readGoalSeconds = (key: string, defaultSeconds: number): number => {
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultSeconds;
};

export const persistGoalSeconds = (key: string, seconds: number) => {
  window.localStorage.setItem(key, String(seconds));
};

// Progress is *daily* -- persisted so it survives a reload or a second tab
// today, but discarded once the stored date is no longer today, same as a
// real daily goal resetting overnight instead of per page load.
export const readDailyProgressSeconds = (key: string): number => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: string; seconds?: number };
    if (parsed.date !== todayDateString()) return 0;
    return typeof parsed.seconds === "number" && parsed.seconds >= 0 ? parsed.seconds : 0;
  } catch {
    return 0;
  }
};

export const persistDailyProgressSeconds = (key: string, seconds: number) => {
  window.localStorage.setItem(key, JSON.stringify({ date: todayDateString(), seconds }));
};

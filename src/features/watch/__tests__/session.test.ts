import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  DEFAULT_WATCH_GOAL_SECONDS,
  getSessionId,
  hasSeenWatchIntroToday,
  markWatchIntroSeenToday,
  persistDailyWatchSeconds,
  persistDislikedIds,
  persistLikedIds,
  persistWatchGoalSeconds,
  readDailyWatchSeconds,
  readDislikedIds,
  readLikedIds,
  readWatchGoalSeconds,
} from "../session";

beforeEach(() => {
  window.localStorage.clear();
});

describe("getSessionId", () => {
  test("creates and persists a new id on first call", () => {
    const id = getSessionId();
    expect(id).toBeTruthy();
    expect(window.localStorage.getItem("dialectrek-watch-session-id")).toBe(id);
  });

  test("returns the same id on subsequent calls", () => {
    const first = getSessionId();
    const second = getSessionId();
    expect(second).toBe(first);
  });
});

describe("liked/disliked id sets", () => {
  test("read returns an empty set when nothing is stored", () => {
    expect(readLikedIds()).toEqual(new Set());
    expect(readDislikedIds()).toEqual(new Set());
  });

  test("persist then read round-trips the same ids", () => {
    persistLikedIds(new Set(["a", "b"]));
    expect(readLikedIds()).toEqual(new Set(["a", "b"]));

    persistDislikedIds(new Set(["c"]));
    expect(readDislikedIds()).toEqual(new Set(["c"]));
  });

  test("liked and disliked ids are stored independently", () => {
    persistLikedIds(new Set(["a"]));
    persistDislikedIds(new Set(["b"]));
    expect(readLikedIds()).toEqual(new Set(["a"]));
    expect(readDislikedIds()).toEqual(new Set(["b"]));
  });

  test("read recovers gracefully from corrupted JSON in storage", () => {
    window.localStorage.setItem("dialectrek-watch-liked-ids", "{not valid json");
    expect(readLikedIds()).toEqual(new Set());
  });
});

describe("watch goal seconds", () => {
  test("defaults to DEFAULT_WATCH_GOAL_SECONDS when nothing is stored", () => {
    expect(readWatchGoalSeconds()).toBe(DEFAULT_WATCH_GOAL_SECONDS);
  });

  test("persist then read round-trips the chosen goal", () => {
    persistWatchGoalSeconds(900);
    expect(readWatchGoalSeconds()).toBe(900);
  });

  test("falls back to the default for invalid stored values", () => {
    window.localStorage.setItem("dialectrek-watch-goal-seconds", "not-a-number");
    expect(readWatchGoalSeconds()).toBe(DEFAULT_WATCH_GOAL_SECONDS);

    window.localStorage.setItem("dialectrek-watch-goal-seconds", "-30");
    expect(readWatchGoalSeconds()).toBe(DEFAULT_WATCH_GOAL_SECONDS);
  });
});

describe("daily watch seconds", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns 0 when nothing is stored", () => {
    expect(readDailyWatchSeconds()).toBe(0);
  });

  test("persist then read round-trips within the same day", () => {
    persistDailyWatchSeconds(123);
    expect(readDailyWatchSeconds()).toBe(123);
  });

  test("resets to 0 once the stored date is no longer today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
    persistDailyWatchSeconds(300);
    expect(readDailyWatchSeconds()).toBe(300);

    vi.setSystemTime(new Date(2024, 0, 2, 0, 0, 1));
    expect(readDailyWatchSeconds()).toBe(0);
  });

  test("recovers gracefully from corrupted JSON in storage", () => {
    window.localStorage.setItem("dialectrek-watch-daily-progress", "{not valid json");
    expect(readDailyWatchSeconds()).toBe(0);
  });
});

describe("watch intro seen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("has not been seen when nothing is stored", () => {
    expect(hasSeenWatchIntroToday()).toBe(false);
  });

  test("has been seen after marking it today", () => {
    markWatchIntroSeenToday();
    expect(hasSeenWatchIntroToday()).toBe(true);
  });

  test("is seen again once the stored date is no longer today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
    markWatchIntroSeenToday();
    expect(hasSeenWatchIntroToday()).toBe(true);

    vi.setSystemTime(new Date(2024, 0, 2, 0, 0, 1));
    expect(hasSeenWatchIntroToday()).toBe(false);
  });
});

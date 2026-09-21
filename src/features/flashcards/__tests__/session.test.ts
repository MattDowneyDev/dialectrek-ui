import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  DEFAULT_FLASHCARDS_GOAL_SECONDS,
  persistDailyFlashcardsSeconds,
  persistFlashcardsGoalSeconds,
  readDailyFlashcardsSeconds,
  readFlashcardsGoalSeconds,
} from "../session";

beforeEach(() => {
  window.localStorage.clear();
});

describe("flashcards goal seconds", () => {
  test("defaults to DEFAULT_FLASHCARDS_GOAL_SECONDS when nothing is stored", () => {
    expect(readFlashcardsGoalSeconds()).toBe(DEFAULT_FLASHCARDS_GOAL_SECONDS);
  });

  test("persist then read round-trips the chosen goal", () => {
    persistFlashcardsGoalSeconds(1200);
    expect(readFlashcardsGoalSeconds()).toBe(1200);
  });

  test("falls back to the default for invalid stored values", () => {
    window.localStorage.setItem("dialectrek-flashcards-goal-seconds", "not-a-number");
    expect(readFlashcardsGoalSeconds()).toBe(DEFAULT_FLASHCARDS_GOAL_SECONDS);

    window.localStorage.setItem("dialectrek-flashcards-goal-seconds", "-30");
    expect(readFlashcardsGoalSeconds()).toBe(DEFAULT_FLASHCARDS_GOAL_SECONDS);
  });
});

describe("daily flashcards seconds", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns 0 when nothing is stored", () => {
    expect(readDailyFlashcardsSeconds()).toBe(0);
  });

  test("persist then read round-trips within the same day", () => {
    persistDailyFlashcardsSeconds(123);
    expect(readDailyFlashcardsSeconds()).toBe(123);
  });

  test("resets to 0 once the stored date is no longer today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
    persistDailyFlashcardsSeconds(300);
    expect(readDailyFlashcardsSeconds()).toBe(300);

    vi.setSystemTime(new Date(2024, 0, 2, 0, 0, 1));
    expect(readDailyFlashcardsSeconds()).toBe(0);
  });

  test("recovers gracefully from corrupted JSON in storage", () => {
    window.localStorage.setItem("dialectrek-flashcards-daily-progress", "{not valid json");
    expect(readDailyFlashcardsSeconds()).toBe(0);
  });
});

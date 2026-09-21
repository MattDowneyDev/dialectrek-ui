import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  DEFAULT_CONJUGATE_GOAL_SECONDS,
  persistConjugateGoalSeconds,
  persistDailyConjugateSeconds,
  readConjugateGoalSeconds,
  readDailyConjugateSeconds,
} from "../session";

beforeEach(() => {
  window.localStorage.clear();
});

describe("conjugate goal seconds", () => {
  test("defaults to DEFAULT_CONJUGATE_GOAL_SECONDS when nothing is stored", () => {
    expect(readConjugateGoalSeconds()).toBe(DEFAULT_CONJUGATE_GOAL_SECONDS);
  });

  test("persist then read round-trips the chosen goal", () => {
    persistConjugateGoalSeconds(1200);
    expect(readConjugateGoalSeconds()).toBe(1200);
  });

  test("falls back to the default for invalid stored values", () => {
    window.localStorage.setItem("dialectrek-conjugate-goal-seconds", "not-a-number");
    expect(readConjugateGoalSeconds()).toBe(DEFAULT_CONJUGATE_GOAL_SECONDS);

    window.localStorage.setItem("dialectrek-conjugate-goal-seconds", "-30");
    expect(readConjugateGoalSeconds()).toBe(DEFAULT_CONJUGATE_GOAL_SECONDS);
  });
});

describe("daily conjugate seconds", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns 0 when nothing is stored", () => {
    expect(readDailyConjugateSeconds()).toBe(0);
  });

  test("persist then read round-trips within the same day", () => {
    persistDailyConjugateSeconds(123);
    expect(readDailyConjugateSeconds()).toBe(123);
  });

  test("resets to 0 once the stored date is no longer today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
    persistDailyConjugateSeconds(300);
    expect(readDailyConjugateSeconds()).toBe(300);

    vi.setSystemTime(new Date(2024, 0, 2, 0, 0, 1));
    expect(readDailyConjugateSeconds()).toBe(0);
  });

  test("recovers gracefully from corrupted JSON in storage", () => {
    window.localStorage.setItem("dialectrek-conjugate-daily-progress", "{not valid json");
    expect(readDailyConjugateSeconds()).toBe(0);
  });
});

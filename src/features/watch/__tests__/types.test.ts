import { describe, expect, test } from "vitest";
import { isDifficultyLevel, isSortMode, levelForScore } from "../types";

describe("isDifficultyLevel", () => {
  test.each(["a1", "a2", "b1", "b2", "c1", "c2"])("accepts %s", (value) => {
    expect(isDifficultyLevel(value)).toBe(true);
  });

  test("rejects an unknown string", () => {
    expect(isDifficultyLevel("z9")).toBe(false);
  });

  test("rejects null", () => {
    expect(isDifficultyLevel(null)).toBe(false);
  });

  test("rejects undefined", () => {
    expect(isDifficultyLevel(undefined)).toBe(false);
  });
});

describe("isSortMode", () => {
  test.each(["easiest", "hardest", "most-liked", "random"])("accepts %s", (value) => {
    expect(isSortMode(value)).toBe(true);
  });

  test("rejects an unknown string", () => {
    expect(isSortMode("alphabetical")).toBe(false);
  });

  test("rejects null", () => {
    expect(isSortMode(null)).toBe(false);
  });

  test("rejects undefined", () => {
    expect(isSortMode(undefined)).toBe(false);
  });
});

describe("levelForScore", () => {
  test.each([
    [699, "a1"],
    [700, "a2"],
    [849, "a2"],
    [850, "b1"],
    [999, "b1"],
    [1000, "b2"],
    [1149, "b2"],
    [1150, "c1"],
    [1299, "c1"],
    [1300, "c2"],
    [2000, "c2"],
  ])("maps score %i to %s", (score, level) => {
    expect(levelForScore(score)).toBe(level);
  });
});

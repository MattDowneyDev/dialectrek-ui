import { describe, expect, test } from "vitest";
import { formatDuration } from "../duration";

describe("formatDuration", () => {
  test("formats whole minutes with zero-padded seconds", () => {
    expect(formatDuration(120)).toBe("2:00");
  });

  test("pads single-digit seconds", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  test("formats durations under a minute", () => {
    expect(formatDuration(9)).toBe("0:09");
  });
});

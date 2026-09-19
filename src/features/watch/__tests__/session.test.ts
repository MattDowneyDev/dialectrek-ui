import { beforeEach, describe, expect, test } from "vitest";
import {
  getSessionId,
  persistDislikedIds,
  persistLikedIds,
  readDislikedIds,
  readLikedIds,
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

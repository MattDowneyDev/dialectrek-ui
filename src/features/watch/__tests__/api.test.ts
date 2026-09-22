import axios from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BASE_URL } from "../../../languages/api";
import {
  PAGE_SIZE,
  compareVideos,
  dislikeVideo,
  fetchRelatedVideos,
  fetchVideo,
  fetchVideos,
  likeVideo,
} from "../api";

vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const mockedAxios = vi.mocked(axios, true);

const apiVideo = (overrides = {}) => ({
  id: "v1",
  youtube_id: "yt1",
  title: "Title",
  channel: "Channel",
  duration_seconds: 120,
  difficulty_score: 900,
  like_count: 3,
  ...overrides,
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchVideos", () => {
  test("maps snake_case fields to camelCase Video objects", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { items: [apiVideo()], has_more: true },
    });
    const result = await fetchVideos("es");
    expect(result).toEqual({
      items: [
        {
          id: "v1",
          youtubeId: "yt1",
          title: "Title",
          channel: "Channel",
          durationSeconds: 120,
          difficultyScore: 900,
          likeCount: 3,
        },
      ],
      hasMore: true,
    });
  });

  test("defaults offset to 0 and always sends the fixed PAGE_SIZE limit", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { items: [], has_more: false } });
    await fetchVideos("es", { level: "b1", sort: "easiest" });
    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/es/videos`, {
      params: { level: "b1", sort: "easiest", seed: undefined, offset: 0, limit: PAGE_SIZE },
    });
  });

  test("retries on failure and returns the page if a later attempt succeeds", async () => {
    vi.useFakeTimers();
    mockedAxios.get
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ data: { items: [apiVideo()], has_more: false } });
    const resultPromise = fetchVideos("es");
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toEqual({
      items: [
        {
          id: "v1",
          youtubeId: "yt1",
          title: "Title",
          channel: "Channel",
          durationSeconds: 120,
          difficultyScore: 900,
          likeCount: 3,
        },
      ],
      hasMore: false,
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  test("returns an empty page flagged as an error once every retry fails", async () => {
    vi.useFakeTimers();
    mockedAxios.get.mockRejectedValue(new Error("network error"));
    const resultPromise = fetchVideos("es");
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toEqual({ items: [], hasMore: false, error: true });
    vi.useRealTimers();
  });
});

describe("fetchVideo", () => {
  test("returns the mapped video on success", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: apiVideo({ id: "v2" }) });
    const result = await fetchVideo("es", "v2");
    expect(result?.id).toBe("v2");
  });

  test("returns undefined on failure", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("not found"));
    await expect(fetchVideo("es", "missing")).resolves.toBeUndefined();
  });
});

describe("fetchRelatedVideos", () => {
  test("maps snake_case fields to camelCase Video objects", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [apiVideo({ id: "v2" })] });
    const result = await fetchRelatedVideos("es", "v1");
    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/es/videos/v1/related`);
    expect(result).toEqual([
      {
        id: "v2",
        youtubeId: "yt1",
        title: "Title",
        channel: "Channel",
        durationSeconds: 120,
        difficultyScore: 900,
        likeCount: 3,
      },
    ]);
  });

  test("returns an empty array instead of throwing on failure", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("network error"));
    await expect(fetchRelatedVideos("es", "v1")).resolves.toEqual([]);
  });
});

describe("likeVideo", () => {
  test("posts the session id and returns the updated video", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: apiVideo({ like_count: 4 }) });
    const result = await likeVideo("es", "v1", "session-1");
    expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}/es/videos/v1/like`, {
      session_id: "session-1",
    });
    expect(result?.likeCount).toBe(4);
  });

  test("returns undefined on failure", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("boom"));
    await expect(likeVideo("es", "v1", "s1")).resolves.toBeUndefined();
  });
});

describe("dislikeVideo", () => {
  test("posts the session id and returns the updated video", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: apiVideo({ like_count: -1 }) });
    const result = await dislikeVideo("es", "v1", "session-1");
    expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}/es/videos/v1/dislike`, {
      session_id: "session-1",
    });
    expect(result?.likeCount).toBe(-1);
  });
});

describe("compareVideos", () => {
  test("posts easier_video_id/session_id and maps both returned videos", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        harder_video: apiVideo({ id: "harder" }),
        easier_video: apiVideo({ id: "easier" }),
      },
    });
    const result = await compareVideos("es", "harder", "easier", "session-1");
    expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}/es/videos/harder/compare`, {
      easier_video_id: "easier",
      session_id: "session-1",
    });
    expect(result).toEqual({
      harderVideo: expect.objectContaining({ id: "harder" }),
      easierVideo: expect.objectContaining({ id: "easier" }),
    });
  });

  test("returns undefined on failure", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("boom"));
    await expect(compareVideos("es", "a", "b", "s1")).resolves.toBeUndefined();
  });
});

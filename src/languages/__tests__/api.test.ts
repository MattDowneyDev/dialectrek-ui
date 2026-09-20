import axios from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  BASE_URL,
  fetchAllVerbs,
  fetchImperativeConjugation,
  fetchRandomVerbConjugation,
  fetchRandomWord,
  fetchVerbConjugation,
  fetchWordCategories,
} from "../api";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axios, true);

beforeEach(() => {
  vi.useFakeTimers();
  mockedAxios.isAxiosError.mockImplementation(
    (error: unknown): error is import("axios").AxiosError =>
      Boolean(error && typeof error === "object" && "isAxiosError" in error),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const axiosError = (status: number) => ({
  isAxiosError: true,
  response: { status },
  config: { url: "/some-url", params: {} },
});

describe("fetchAllVerbs", () => {
  test("returns the response data on success", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [["hablar", "to speak"]] });
    const result = await fetchAllVerbs("es");
    expect(result).toEqual([["hablar", "to speak"]]);
    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/es/get-all-verbs`);
  });

  test("returns an empty array (not a throw) when every retry fails", async () => {
    mockedAxios.get.mockRejectedValue(axiosError(500));
    const promise = fetchAllVerbs("es");
    // withRetry backs off between attempts -- advance fake timers so the
    // retry loop can actually finish inside this test.
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual([]);
  });

  test("does not retry a non-retryable 404", async () => {
    mockedAxios.get.mockRejectedValue(axiosError(404));
    const promise = fetchAllVerbs("es");
    await vi.runAllTimersAsync();
    await promise;
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});

describe("fetchRandomVerbConjugation", () => {
  test("returns the first row of the response array", async () => {
    const row = { infinitive_target: "hablar" };
    mockedAxios.get.mockResolvedValueOnce({ data: [row, { infinitive_target: "comer" }] });
    const result = await fetchRandomVerbConjugation("es", true, false, "indicative", "present", "affirmative");
    expect(result).toEqual(row);
  });

  test("passes mood/tense/polarity/use_irregular/use_regional_variant as params", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{}] });
    await fetchRandomVerbConjugation("es", true, true, "subjunctive", "imperfect", "negative");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${BASE_URL}/es/get-random-verb-conjugation`,
      {
        params: {
          mood: "subjunctive",
          tense: "imperfect",
          polarity: "negative",
          use_irregular: true,
          use_regional_variant: true,
        },
      },
    );
  });

  test("returns undefined on failure", async () => {
    mockedAxios.get.mockRejectedValue(axiosError(503));
    const promise = fetchRandomVerbConjugation("es", true);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();
  });
});

describe("fetchVerbConjugation", () => {
  test("decodes an already-percent-encoded verb param", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    await fetchVerbConjugation("es", "o%C3%ADr");
    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/es/get-verb-conjugation`, {
      params: { verb: "oír", mood: "indicative", tense: "present" },
    });
  });

  test("leaves an already-plain verb param untouched", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    await fetchVerbConjugation("es", "hablar");
    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/es/get-verb-conjugation`, {
      params: { verb: "hablar", mood: "indicative", tense: "present" },
    });
  });

  test("falls back to the raw string if decoding throws (malformed percent-escape)", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    await fetchVerbConjugation("es", "%");
    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/es/get-verb-conjugation`, {
      params: { verb: "%", mood: "indicative", tense: "present" },
    });
  });
});

describe("fetchImperativeConjugation", () => {
  test("requests with tense fixed to imperative", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    await fetchImperativeConjugation("es", "hablar");
    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/es/get-verb-conjugation`, {
      params: { verb: "hablar", tense: "imperative" },
    });
  });
});

describe("fetchRandomWord", () => {
  test("passes an optional category through as a param", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { rank: 1 } });
    await fetchRandomWord("es", "greeting");
    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/es/get-random-word`, {
      params: { category: "greeting" },
    });
  });

  test("returns undefined on failure", async () => {
    mockedAxios.get.mockRejectedValue(axiosError(404));
    const promise = fetchRandomWord("es");
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();
  });
});

describe("fetchWordCategories", () => {
  test("returns the category list on success", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: ["greeting", "food"] });
    await expect(fetchWordCategories("es")).resolves.toEqual(["greeting", "food"]);
  });

  test("returns an empty array on failure", async () => {
    mockedAxios.get.mockRejectedValue(axiosError(500));
    const promise = fetchWordCategories("es");
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual([]);
  });
});

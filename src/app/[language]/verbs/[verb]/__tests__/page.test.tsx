import { test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type {
  ImperativeConjugationTable,
  VerbConjugationTable,
} from "../../../../../languages/types";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const fetchAllVerbsMock = vi.fn();
const fetchVerbConjugationMock = vi.fn();
const fetchImperativeConjugationMock = vi.fn();

vi.mock("../../../../../languages/api", () => ({
  fetchAllVerbs: fetchAllVerbsMock,
  fetchVerbConjugation: fetchVerbConjugationMock,
  fetchImperativeConjugation: fetchImperativeConjugationMock,
}));

const { notFound } = await import("next/navigation");
const {
  default: VerbDetailPage,
  generateMetadata,
  generateStaticParams,
} = await import("../page");

const presentTable = (mood: "indicative" | "subjunctive"): VerbConjugationTable => ({
  infinitive_target: "hablar",
  infinitive_english: "to speak",
  mood,
  tense: "present",
  conjugations: [
    {
      pronoun_target: "yo",
      pronoun_english: "I",
      form_target: "hablo",
      form_english: "speak",
    },
  ],
});

const imperativeTable: ImperativeConjugationTable = {
  infinitive_target: "hablar",
  infinitive_english: "to speak",
  tense: "imperative",
  conjugations: [
    {
      pronoun_target: "tú",
      pronoun_english: "you",
      form_target_affirmative: "habla",
      form_target_negative: "no hables",
      form_english_affirmative: "speak",
      form_english_negative: "don't speak",
    },
  ],
};

beforeEach(() => {
  fetchAllVerbsMock.mockReset();
  fetchImperativeConjugationMock.mockReset();
  fetchImperativeConjugationMock.mockResolvedValue(imperativeTable);
  vi.mocked(notFound).mockClear();

  fetchVerbConjugationMock.mockReset();
  fetchVerbConjugationMock.mockImplementation(
    async (_language: string, verb: string, mood: "indicative" | "subjunctive", tense: string) => {
      if (verb === "hablar" && tense === "present") {
        return presentTable(mood);
      }
      return undefined;
    },
  );
});

test("renders the verb detail page with breadcrumb JSON-LD for a known verb", async () => {
  const element = await VerbDetailPage({
    params: Promise.resolve({ language: "es", verb: "hablar" }),
  });
  render(element);

  expect(screen.getByRole("heading", { name: "hablar", level: 1 })).toBeInTheDocument();
  expect(screen.getByText("to speak")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Present" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Imperative" })).toBeInTheDocument();
  expect(notFound).not.toHaveBeenCalled();

  const script = document.querySelector('script[type="application/ld+json"]');
  const jsonLd = JSON.parse(script?.innerHTML ?? "{}");
  expect(jsonLd["@type"]).toBe("BreadcrumbList");
  expect(jsonLd.itemListElement).toHaveLength(4);
  expect(jsonLd.itemListElement[3].name).toBe("hablar");
});

test("calls notFound when the verb has no present-tense indicative conjugation", async () => {
  await expect(
    VerbDetailPage({ params: Promise.resolve({ language: "es", verb: "not-a-verb" }) }),
  ).rejects.toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalled();
});

test("returns null for an unknown language before fetching anything", async () => {
  const element = await VerbDetailPage({
    params: Promise.resolve({ language: "de", verb: "hablar" }),
  });
  expect(element).toBeNull();
  expect(fetchVerbConjugationMock).not.toHaveBeenCalled();
});

test("generates metadata from the verb's present-tense conjugation", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ language: "es", verb: "hablar" }),
  });
  expect(metadata.title).toBe("hablar Conjugation");
  expect(metadata.description).toContain("to speak");
  expect(metadata.alternates?.canonical).toBe("/es/verbs/hablar");
});

test("falls back to the raw verb param as the metadata title when it isn't found", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ language: "es", verb: "not-a-verb" }),
  });
  expect(metadata).toEqual({ title: "not-a-verb" });
});

test("returns empty metadata for an unknown language", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ language: "de", verb: "hablar" }),
  });
  expect(metadata).toEqual({});
});

test("generates static params for every enabled language's verbs", async () => {
  fetchAllVerbsMock.mockImplementation(async (language: string) => {
    if (language === "es") return [["hablar", "to speak"]];
    throw new Error("backend unreachable");
  });
  const params = await generateStaticParams();
  expect(params).toContainEqual({ language: "es", verb: "hablar" });
  expect(params.some((param) => param.language === "fr")).toBe(false);
});

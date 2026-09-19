import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GrammarPage, { generateMetadata } from "../page";

vi.mock("../../../../languages/registry", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../../languages/registry")>();
  return {
    ...actual,
    LANGUAGES: {
      ...actual.LANGUAGES,
      es: { ...actual.LANGUAGES.es, grammarTopics: [], upcomingGrammarTopics: [] },
    },
  };
});

test("lists grammar topics with links for a language that has them", async () => {
  const element = await GrammarPage({ params: Promise.resolve({ language: "fr" }) });
  render(element);
  const links = screen.getAllByRole("link");
  expect(links.length).toBeGreaterThan(0);
  expect(links[0]).toHaveAttribute("href", expect.stringContaining("/fr/grammar/"));
});

test("shows a coming-soon page when there are no topics at all", async () => {
  const element = await GrammarPage({ params: Promise.resolve({ language: "es" }) });
  render(element);
  expect(screen.getByText("Under construction")).toBeInTheDocument();
});

test("returns null for an unknown language", async () => {
  const element = await GrammarPage({ params: Promise.resolve({ language: "de" }) });
  expect(element).toBeNull();
});

test("generates metadata reflecting grammar topic availability", async () => {
  const available = await generateMetadata({ params: Promise.resolve({ language: "fr" }) });
  expect(available.title).toBe("French Grammar Concepts");
  expect(available.description).toContain("trip learners up");

  const comingSoon = await generateMetadata({ params: Promise.resolve({ language: "es" }) });
  expect(comingSoon.description).toContain("coming soon");
});

test("returns empty metadata for an unknown language", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "de" }) });
  expect(metadata).toEqual({});
});

import { test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { LanguageDefinition } from "../../../../languages/registry";
import type { VerbEntry } from "../../../../languages/types";

const fetchAllVerbsMock = vi.fn();

vi.mock("../../../../languages/api", () => ({
  fetchAllVerbs: fetchAllVerbsMock,
}));

vi.mock("../../../../features/verbs/VerbsList", () => ({
  default: ({ code, verbs }: { code: string; verbs: VerbEntry[] }) => (
    <div data-testid="verbs-list">
      {code} / {verbs.length}
    </div>
  ),
}));

vi.mock("../../../../languages/registry", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../../languages/registry")>();
  return {
    ...actual,
    LANGUAGES: {
      ...actual.LANGUAGES,
      es: { ...actual.LANGUAGES.es, hasVerbs: false },
    },
  };
});

const { default: VerbsPage, generateMetadata } = await import("../page");

beforeEach(() => {
  fetchAllVerbsMock.mockReset();
});

test("fetches and renders the verb list for a language with verb support", async () => {
  fetchAllVerbsMock.mockResolvedValue([
    ["hablar", "to speak"],
    ["comer", "to eat"],
  ] satisfies VerbEntry[]);
  const element = await VerbsPage({ params: Promise.resolve({ language: "fr" }) });
  render(element);
  expect(fetchAllVerbsMock).toHaveBeenCalledWith("fr");
  expect(screen.getByRole("heading", { name: "Verbs" })).toBeInTheDocument();
  expect(screen.getByTestId("verbs-list")).toHaveTextContent("fr / 2");
});

test("shows a coming-soon page and skips fetching for a language without verb support", async () => {
  const element = await VerbsPage({ params: Promise.resolve({ language: "es" }) });
  render(element);
  expect(fetchAllVerbsMock).not.toHaveBeenCalled();
  expect(screen.getByText("Under construction")).toBeInTheDocument();
});

test("returns null for an unknown language", async () => {
  const element = await VerbsPage({ params: Promise.resolve({ language: "de" }) });
  expect(element).toBeNull();
});

test("generates metadata reflecting verb availability", async () => {
  const available = await generateMetadata({ params: Promise.resolve({ language: "fr" }) });
  expect(available.title).toBe("French Verbs List");
  expect(available.description).toContain("100 most common");

  const comingSoon = await generateMetadata({ params: Promise.resolve({ language: "es" }) });
  expect(comingSoon.description).toContain("coming soon");
});

test("returns empty metadata for an unknown language", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "de" }) });
  expect(metadata).toEqual({});
});

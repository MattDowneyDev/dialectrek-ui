import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { LanguageDefinition } from "../../../../languages/registry";

vi.mock("../../../../features/conjugate/ConjugateClient", () => ({
  default: ({
    code,
    definition,
    initialTenses,
  }: {
    code: string;
    definition: LanguageDefinition;
    initialTenses: string[];
  }) => (
    <div data-testid="conjugate-client">
      {code} / {definition.displayName} / {initialTenses.join(",")}
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

const { default: ConjugatePage, generateMetadata } = await import("../page");

const noSearchParams = Promise.resolve({});

test("renders ConjugateClient with the requested tenses filtered to what's available", async () => {
  const element = await ConjugatePage({
    params: Promise.resolve({ language: "fr" }),
    searchParams: Promise.resolve({ tenses: "present,future,imperative,not-a-tense" }),
  });
  render(element);
  const client = screen.getByTestId("conjugate-client");
  expect(client).toHaveTextContent("fr / French");
  expect(client).toHaveTextContent("present,future,imperative");
  expect(client).not.toHaveTextContent("not-a-tense");
});

test("defaults to no pre-selected tenses when none are requested", async () => {
  const element = await ConjugatePage({
    params: Promise.resolve({ language: "fr" }),
    searchParams: noSearchParams,
  });
  render(element);
  const client = screen.getByTestId("conjugate-client");
  expect(client).toHaveTextContent("fr / French /");
});

test("shows a coming-soon page for a language without verb support", async () => {
  const element = await ConjugatePage({
    params: Promise.resolve({ language: "es" }),
    searchParams: noSearchParams,
  });
  render(element);
  expect(screen.queryByTestId("conjugate-client")).not.toBeInTheDocument();
  expect(screen.getByText("Under construction")).toBeInTheDocument();
});

test("returns null for an unknown language", async () => {
  const element = await ConjugatePage({
    params: Promise.resolve({ language: "de" }),
    searchParams: noSearchParams,
  });
  expect(element).toBeNull();
});

test("generates metadata reflecting verb-conjugation availability", async () => {
  const available = await generateMetadata({ params: Promise.resolve({ language: "fr" }) });
  expect(available.title).toBe("Conjugate French Verbs");
  expect(available.description).toContain("Quiz yourself");

  const comingSoon = await generateMetadata({ params: Promise.resolve({ language: "es" }) });
  expect(comingSoon.description).toContain("coming soon");
});

test("returns empty metadata for an unknown language", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "de" }) });
  expect(metadata).toEqual({});
});

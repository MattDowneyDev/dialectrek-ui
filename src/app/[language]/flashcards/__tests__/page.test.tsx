import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { LanguageDefinition } from "../../../../languages/registry";
import FlashcardsPage, { generateMetadata } from "../page";

vi.mock("../../../../features/flashcards/FlashcardsClient", () => ({
  default: ({ code, definition }: { code: string; definition: LanguageDefinition }) => (
    <div data-testid="flashcards-client">
      {code} / {definition.displayName}
    </div>
  ),
}));

test("renders FlashcardsClient with the language's code and definition", async () => {
  const element = await FlashcardsPage({ params: Promise.resolve({ language: "es" }) });
  render(element);
  expect(screen.getByTestId("flashcards-client")).toHaveTextContent("es / Spanish");
});

test("returns null for an unknown language", async () => {
  const element = await FlashcardsPage({ params: Promise.resolve({ language: "de" }) });
  expect(element).toBeNull();
});

test("generates metadata mentioning the language's word count", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "fr" }) });
  expect(metadata.title).toBe("French Flashcards");
  expect(metadata.description).toContain("2000");
  expect(metadata.alternates?.canonical).toBe("/fr/flashcards");
});

test("returns empty metadata for an unknown language", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "de" }) });
  expect(metadata).toEqual({});
});

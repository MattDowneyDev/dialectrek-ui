import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ComingSoon from "../ComingSoon";
import type { LanguageDefinition } from "../../languages/registry";

const baseDefinition: LanguageDefinition = {
  code: "de",
  displayName: "German",
  flagEmoji: "",
  enabled: true,
  hasVerbs: false,
  hasWatch: false,
  verbCount: 0,
  wordCount: 0,
  tenseLabels: {} as LanguageDefinition["tenseLabels"],
  availableTenses: [],
  indicativeOnlyTenses: [],
  hasSubjunctive: false,
  accentChars: [],
  extraToggles: [],
  grammarTopics: [],
  upcomingGrammarTopics: [],
};

test("with only flashcards available, uses singular grammar and no list punctuation", () => {
  render(
    <ComingSoon title="Grammar" language="de" definition={baseDefinition} />,
  );
  expect(screen.getByRole("heading", { name: "Grammar" })).toBeInTheDocument();
  expect(screen.getByText("Under construction")).toBeInTheDocument();
  expect(
    screen.getByText(
      "We haven't built Grammar for German yet, but Flashcards is ready to go in the meantime.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Flashcards" })).toHaveAttribute(
    "href",
    "/de/flashcards",
  );
});

test("with two available features, joins them with 'and'", () => {
  const definition = { ...baseDefinition, grammarTopics: [{ slug: "x", title: "X" }] as never };
  render(<ComingSoon title="Watch" language="de" definition={definition} />);
  expect(
    screen.getByText(
      "We haven't built Watch for German yet, but Flashcards and Grammar are ready to go in the meantime.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Grammar" })).toHaveAttribute(
    "href",
    "/de/grammar",
  );
});

test("with more than two available features, uses an Oxford comma", () => {
  const definition = { ...baseDefinition, hasVerbs: true };
  render(<ComingSoon title="Watch" language="es" definition={definition} />);
  expect(
    screen.getByText(
      "We haven't built Watch for German yet, but Verbs, Conjugate, and Flashcards are ready to go in the meantime.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Verbs" })).toHaveAttribute(
    "href",
    "/es/verbs",
  );
  expect(screen.getByRole("link", { name: "Conjugate" })).toHaveAttribute(
    "href",
    "/es/conjugate",
  );
});

test("with every feature available, lists all four with an Oxford comma", () => {
  const definition = {
    ...baseDefinition,
    hasVerbs: true,
    grammarTopics: [{ slug: "x", title: "X" }] as never,
  };
  render(<ComingSoon title="Something" language="es" definition={definition} />);
  expect(
    screen.getByText(
      "We haven't built Something for German yet, but Verbs, Conjugate, Flashcards, and Grammar are ready to go in the meantime.",
    ),
  ).toBeInTheDocument();
});

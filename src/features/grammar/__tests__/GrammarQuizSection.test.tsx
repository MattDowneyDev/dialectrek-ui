import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GrammarQuizSection from "../GrammarQuizSection";
import type { GrammarCompareSide, GrammarQuizQuestion } from "../../../languages/types";

const side = (label: string): GrammarCompareSide => ({
  label,
  kicker: "kicker",
  triggers: [],
  examples: [],
});

const questions: GrammarQuizQuestion[] = [
  {
    before: "Yo ",
    after: " a la tienda.",
    infinitive: "ir",
    correctTone: "a",
    correctForm: "fui",
    explanation: "Completed single action.",
  },
];

const cta = { heading: "Ready?", body: "Test yourself.", buttonLabel: "Start quiz" };

test("shows the CTA card before the quiz starts", () => {
  render(<GrammarQuizSection questions={questions} sideA={side("A")} sideB={side("B")} cta={cta} />);
  expect(screen.getByRole("heading", { name: "Ready?" })).toBeInTheDocument();
  expect(screen.getByText("Test yourself.")).toBeInTheDocument();
  expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument();
});

test("starts the quiz when the CTA button is clicked", async () => {
  const user = userEvent.setup();
  render(<GrammarQuizSection questions={questions} sideA={side("A")} sideB={side("B")} cta={cta} />);
  await user.click(screen.getByRole("button", { name: "Start quiz" }));
  expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Ready?" })).not.toBeInTheDocument();
});

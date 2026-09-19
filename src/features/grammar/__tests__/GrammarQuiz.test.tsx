import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GrammarQuiz from "../GrammarQuiz";
import type { GrammarCompareSide, GrammarQuizQuestion } from "../../../languages/types";

const sideA: GrammarCompareSide = { label: "Preterite", kicker: "", triggers: [], examples: [] };
const sideB: GrammarCompareSide = { label: "Imperfect", kicker: "", triggers: [], examples: [] };

const oneQuestion: GrammarQuizQuestion[] = [
  {
    before: "Yo ",
    after: " a la tienda.",
    infinitive: "ir",
    correctTone: "a",
    correctForm: "fui",
    explanation: "A single completed action.",
  },
];

const twoQuestions: GrammarQuizQuestion[] = [
  ...oneQuestion,
  {
    before: "Cuando era niño, ",
    after: " todos los días.",
    infinitive: "jugar",
    correctTone: "b",
    correctForm: "jugaba",
    explanation: "A habitual past action.",
  },
];

afterEach(() => {
  vi.useRealTimers();
});

test("renders the first question with a blank and no feedback yet", () => {
  render(<GrammarQuiz questions={oneQuestion} sideA={sideA} sideB={sideB} />);
  expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
  expect(screen.getByText("____")).toBeInTheDocument();
  expect(screen.getByText("(ir)")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Preterite" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Imperfect" })).toBeInTheDocument();
  expect(screen.queryByText("Correct")).not.toBeInTheDocument();
});

test("selecting the correct answer shows the correct feedback and fills the blank", async () => {
  const user = userEvent.setup();
  render(<GrammarQuiz questions={oneQuestion} sideA={sideA} sideB={sideB} />);
  await user.click(screen.getByRole("button", { name: "Preterite" }));
  expect(screen.getByText("Correct")).toBeInTheDocument();
  expect(screen.getByText("fui")).toBeInTheDocument();
  expect(screen.getByText("A single completed action.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Preterite" })).toHaveClass("selected", "correct");
});

test("selecting the wrong answer shows incorrect feedback and marks both choices", async () => {
  const user = userEvent.setup();
  render(<GrammarQuiz questions={oneQuestion} sideA={sideA} sideB={sideB} />);
  await user.click(screen.getByRole("button", { name: "Imperfect" }));
  expect(screen.getByText("Not quite")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Imperfect" })).toHaveClass("selected", "incorrect");
  expect(screen.getByRole("button", { name: "Preterite" })).toHaveClass("correct");
});

test("choices are disabled and inert once a question has been answered", async () => {
  const user = userEvent.setup();
  render(<GrammarQuiz questions={oneQuestion} sideA={sideA} sideB={sideB} />);
  await user.click(screen.getByRole("button", { name: "Preterite" }));
  expect(screen.getByRole("button", { name: "Preterite" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Imperfect" })).toBeDisabled();

  await user.click(screen.getByRole("button", { name: "Imperfect" }));
  expect(screen.getByRole("button", { name: "Imperfect" })).not.toHaveClass("selected");
});

test("advances to the next question and clears the previous answer", async () => {
  const user = userEvent.setup();
  render(<GrammarQuiz questions={twoQuestions} sideA={sideA} sideB={sideB} />);
  await user.click(screen.getByRole("button", { name: "Preterite" }));
  await user.click(screen.getByRole("button", { name: "Next question" }));

  expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
  expect(screen.getByText("____")).toBeInTheDocument();
  expect(screen.getByText("(jugar)")).toBeInTheDocument();
});

test("tracks correct count across questions via the counter stat", async () => {
  const user = userEvent.setup();
  render(<GrammarQuiz questions={twoQuestions} sideA={sideA} sideB={sideB} />);
  expect(screen.getByText("0")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Preterite" }));
  expect(screen.getByText("1")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Next question" }));
  await user.click(screen.getByRole("button", { name: "Imperfect" }));
  expect(screen.getByText("2")).toBeInTheDocument();
});

test("the last question's button says 'See results' and completing shows the score screen", async () => {
  const user = userEvent.setup();
  render(<GrammarQuiz questions={oneQuestion} sideA={sideA} sideB={sideB} />);
  await user.click(screen.getByRole("button", { name: "Imperfect" }));
  expect(screen.getByRole("button", { name: "See results" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "See results" }));

  expect(screen.getByRole("heading", { name: "Quiz complete" })).toBeInTheDocument();
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getByText("/1")).toBeInTheDocument();
  expect(screen.getByText("0% correct")).toBeInTheDocument();
});

test("restarting resets progress and returns to the first question", async () => {
  const user = userEvent.setup();
  render(<GrammarQuiz questions={oneQuestion} sideA={sideA} sideB={sideB} />);
  await user.click(screen.getByRole("button", { name: "Imperfect" }));
  await user.click(screen.getByRole("button", { name: "See results" }));
  await user.click(screen.getByRole("button", { name: "Try again" }));

  expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Quiz complete" })).not.toBeInTheDocument();
});

test("restarting a multi-question quiz reshuffles the question order without losing any questions", async () => {
  const user = userEvent.setup();
  render(<GrammarQuiz questions={twoQuestions} sideA={sideA} sideB={sideB} />);
  await user.click(screen.getByRole("button", { name: "Preterite" }));
  await user.click(screen.getByRole("button", { name: "Next question" }));
  await user.click(screen.getByRole("button", { name: "Imperfect" }));
  await user.click(screen.getByRole("button", { name: "See results" }));
  await user.click(screen.getByRole("button", { name: "Try again" }));

  expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  expect(["(ir)", "(jugar)"]).toContain(screen.getByText(/^\(.+\)$/).textContent);
});

test("shows confetti when every question is answered correctly, then hides it after a delay", () => {
  vi.useFakeTimers();
  render(<GrammarQuiz questions={oneQuestion} sideA={sideA} sideB={sideB} />);
  fireEvent.click(screen.getByRole("button", { name: "Preterite" }));
  fireEvent.click(screen.getByRole("button", { name: "See results" }));

  expect(screen.getByText("100% correct")).toBeInTheDocument();
  expect(document.querySelector(".confetti-container")).toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(2800);
  });
  expect(document.querySelector(".confetti-container")).not.toBeInTheDocument();
});

test("does not show confetti when the score is imperfect", () => {
  render(<GrammarQuiz questions={oneQuestion} sideA={sideA} sideB={sideB} />);
  fireEvent.click(screen.getByRole("button", { name: "Imperfect" }));
  fireEvent.click(screen.getByRole("button", { name: "See results" }));
  expect(document.querySelector(".confetti-container")).not.toBeInTheDocument();
});

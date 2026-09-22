import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import TenseSelection from "../TenseSelection";
import type { Tense, TenseExample } from "../../../languages/types";

const tenseLabels: Record<Tense, string> = {
  present: "Present",
  preterite: "Preterite",
  imperfect: "Imperfect",
  perfect: "Present Perfect",
  future: "Future",
  future_perfect: "Future Perfect",
  conditional: "Conditional",
  conditional_perfect: "Conditional Perfect",
  preterite_perfect: "Preterite Perfect",
  pluperfect: "Pluperfect",
  imperative: "Imperative",
};

const tenseExamples: Record<Tense, TenseExample> = {
  present: { target: "Yo hablo", english: "I speak" },
  preterite: { target: "Yo hablé", english: "I spoke" },
  imperfect: { target: "Yo hablaba", english: "I was speaking" },
  perfect: { target: "Yo he hablado", english: "I have spoken" },
  future: { target: "Yo hablaré", english: "I will speak" },
  future_perfect: { target: "Yo habré hablado", english: "I will have spoken" },
  conditional: { target: "Yo hablaría", english: "I would speak" },
  conditional_perfect: { target: "Yo habría hablado", english: "I would have spoken" },
  preterite_perfect: { target: "Yo hube hablado", english: "I had spoken" },
  pluperfect: { target: "Yo había hablado", english: "I had spoken" },
  imperative: { target: "¡Habla!", english: "Speak!" },
};

const tenseList: Tense[] = ["present", "preterite", "imperfect"];

test("renders a card for every tense in the list", () => {
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={[]}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Present" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Preterite" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Imperfect" })).toBeInTheDocument();
});

test("shows each tense's example phrase and translation under its name", () => {
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={[]}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByText("Yo hablo")).toBeInTheDocument();
  expect(screen.getByText("I speak")).toBeInTheDocument();
  expect(screen.getByText("Yo hablaba")).toBeInTheDocument();
  expect(screen.getByText("I was speaking")).toBeInTheDocument();
});

test("the accessible name for a tense card is just its label, not the example text", () => {
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={[]}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Present" })).toBeInTheDocument();
});

test("marks selected tenses with the selected class", () => {
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={["preterite"]}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Preterite" })).toHaveClass(
    "selection-card--selected",
  );
  expect(screen.getByRole("button", { name: "Present" })).not.toHaveClass(
    "selection-card--selected",
  );
});

test("clicking a card calls onToggleTense with that tense", async () => {
  const user = userEvent.setup();
  const onToggleTense = vi.fn();
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={[]}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={onToggleTense}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Imperfect" }));
  expect(onToggleTense).toHaveBeenCalledWith("imperfect");
});

test("renders an All tenses card first, unselected when not everything is selected, and calls onToggleAllTenses", async () => {
  const user = userEvent.setup();
  const onToggleAllTenses = vi.fn();
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={["present"]}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={vi.fn()}
      onToggleAllTenses={onToggleAllTenses}
      onConfirm={vi.fn()}
    />,
  );
  const button = screen.getByRole("button", { name: "All tenses" });
  expect(button).not.toHaveClass("selection-card--selected");
  await user.click(button);
  expect(onToggleAllTenses).toHaveBeenCalledTimes(1);
});

test("marks the All tenses card selected once every tense is already selected", () => {
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={tenseList}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "All tenses" })).toHaveClass(
    "selection-card--selected",
  );
});

test("disables the confirm button until at least one tense is selected", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  const { rerender } = render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={[]}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  expect(screen.getByRole("button", { name: "Let's go!" })).toBeDisabled();

  rerender(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={["present"]}
      tenseLabels={tenseLabels}
      tenseExamples={tenseExamples}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  const confirmButton = screen.getByRole("button", { name: "Let's go!" });
  expect(confirmButton).toBeEnabled();
  await user.click(confirmButton);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

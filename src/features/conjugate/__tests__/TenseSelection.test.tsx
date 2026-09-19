import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import TenseSelection from "../TenseSelection";
import type { Tense } from "../../../languages/types";

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

const tenseList: Tense[] = ["present", "preterite", "imperfect"];

test("renders a chip for every tense in the list", () => {
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={[]}
      tenseLabels={tenseLabels}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Present" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Preterite" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Imperfect" })).toBeInTheDocument();
});

test("marks selected tenses with the selected class", () => {
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={["preterite"]}
      tenseLabels={tenseLabels}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Preterite" })).toHaveClass("selected");
  expect(screen.getByRole("button", { name: "Present" })).not.toHaveClass("selected");
});

test("clicking a chip calls onToggleTense with that tense", async () => {
  const user = userEvent.setup();
  const onToggleTense = vi.fn();
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={[]}
      tenseLabels={tenseLabels}
      onToggleTense={onToggleTense}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Imperfect" }));
  expect(onToggleTense).toHaveBeenCalledWith("imperfect");
});

test("shows Select all when not everything is selected, and calls onToggleAllTenses", async () => {
  const user = userEvent.setup();
  const onToggleAllTenses = vi.fn();
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={["present"]}
      tenseLabels={tenseLabels}
      onToggleTense={vi.fn()}
      onToggleAllTenses={onToggleAllTenses}
      onConfirm={vi.fn()}
    />,
  );
  const button = screen.getByRole("button", { name: "Select all" });
  await user.click(button);
  expect(onToggleAllTenses).toHaveBeenCalledTimes(1);
});

test("shows Deselect all when every tense is already selected", () => {
  render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={tenseList}
      tenseLabels={tenseLabels}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Deselect all" })).toBeInTheDocument();
});

test("disables the confirm button until at least one tense is selected", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  const { rerender } = render(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={[]}
      tenseLabels={tenseLabels}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  expect(screen.getByRole("button", { name: "Let's conjugate!" })).toBeDisabled();

  rerender(
    <TenseSelection
      tenseList={tenseList}
      tenseSelection={["present"]}
      tenseLabels={tenseLabels}
      onToggleTense={vi.fn()}
      onToggleAllTenses={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  const confirmButton = screen.getByRole("button", { name: "Let's conjugate!" });
  expect(confirmButton).toBeEnabled();
  await user.click(confirmButton);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

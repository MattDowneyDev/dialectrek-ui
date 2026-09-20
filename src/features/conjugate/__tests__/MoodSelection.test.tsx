import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import MoodSelection from "../MoodSelection";

test("renders the mood options", () => {
  render(<MoodSelection onSelect={vi.fn()} />);
  expect(
    screen.getByRole("heading", { name: "Which mood would you like to practice?" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Indicative" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Subjunctive" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Both" })).toBeInTheDocument();
});

test("calls onSelect with the chosen mood", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<MoodSelection onSelect={onSelect} />);

  await user.click(screen.getByRole("button", { name: "Indicative" }));
  expect(onSelect).toHaveBeenLastCalledWith("indicative");

  await user.click(screen.getByRole("button", { name: "Subjunctive" }));
  expect(onSelect).toHaveBeenLastCalledWith("subjunctive");

  await user.click(screen.getByRole("button", { name: "Both" }));
  expect(onSelect).toHaveBeenLastCalledWith("both");
});

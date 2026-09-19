import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DifficultyBadge from "../DifficultyBadge";

test("renders the label and class for the level the score falls into", () => {
  render(<DifficultyBadge score={900} />);
  const badge = screen.getByText("B1 · Intermediate");
  expect(badge).toBeInTheDocument();
  expect(badge).toHaveClass("difficulty-badge", "difficulty-badge--b1");
});

test("renders a different level for a different score", () => {
  render(<DifficultyBadge score={200} />);
  const badge = screen.getByText("A1 · Beginner");
  expect(badge).toHaveClass("difficulty-badge--a1");
});

import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import QuestionCard from "../QuestionCard";

test("renders a title and children when a title is given", () => {
  render(
    <QuestionCard title="Translate this">
      <p>Hola</p>
    </QuestionCard>,
  );
  expect(screen.getByRole("heading", { name: "Translate this" })).toBeInTheDocument();
  expect(screen.getByText("Hola")).toBeInTheDocument();
});

test("renders without a heading when no title is given", () => {
  render(
    <QuestionCard>
      <p>Just the content</p>
    </QuestionCard>,
  );
  expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  expect(screen.getByText("Just the content")).toBeInTheDocument();
});

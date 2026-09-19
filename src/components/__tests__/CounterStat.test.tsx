import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CounterStat from "../CounterStat";

test("renders the count, total and label", () => {
  render(<CounterStat count={3} total={10} label="Correct" />);
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("/10")).toBeInTheDocument();
  expect(screen.getByText("Correct")).toBeInTheDocument();
});

test("does not add the bump class by default", () => {
  const { container } = render(<CounterStat count={1} total={5} label="Score" />);
  expect(container.firstChild).not.toHaveClass("bump");
});

test("adds the bump class when bump is true", () => {
  const { container } = render(
    <CounterStat count={1} total={5} label="Score" bump />,
  );
  expect(container.firstChild).toHaveClass("bump");
});

import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "../EmptyState";

test("renders its children", () => {
  render(
    <EmptyState>
      <p>Nothing here yet</p>
    </EmptyState>,
  );
  expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
});

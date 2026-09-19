import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "../not-found";

test("renders the not-found message and a link home", () => {
  render(<NotFound />);
  expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  expect(screen.getByText("That page doesn't exist.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go back home" })).toHaveAttribute("href", "/");
});

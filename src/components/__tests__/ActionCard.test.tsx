import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ActionCard from "../ActionCard";

test("renders a link with the title and description", () => {
  render(
    <ActionCard to="/es/verbs" title="Verbs" description="Practice conjugation" />,
  );
  const link = screen.getByRole("link", { name: /Verbs/ });
  expect(link).toHaveAttribute("href", "/es/verbs");
  expect(screen.getByRole("heading", { name: "Verbs" })).toBeInTheDocument();
  expect(screen.getByText("Practice conjugation")).toBeInTheDocument();
});

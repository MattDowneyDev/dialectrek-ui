import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PageHeader from "../PageHeader";

test("renders just the title when nothing else is given", () => {
  const { container } = render(<PageHeader title="Verbs" />);
  expect(screen.getByRole("heading", { name: "Verbs" })).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(container.firstChild).not.toHaveClass("page-header--compact");
});

test("renders a subtitle when given", () => {
  render(<PageHeader title="Verbs" subtitle="Learn the basics" />);
  expect(screen.getByText("Learn the basics")).toBeInTheDocument();
});

test("adds the compact class when compact is true", () => {
  const { container } = render(<PageHeader title="Long user title" compact />);
  expect(container.firstChild).toHaveClass("page-header--compact");
});

test("renders a link-style back link", () => {
  render(<PageHeader title="Verbs" backTo={{ to: "/es", label: "Back" }} />);
  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/es");
});

test("renders a button-style back link and fires its onClick", async () => {
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(<PageHeader title="Verbs" backTo={{ onClick, label: "Back" }} />);

  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(onClick).toHaveBeenCalledTimes(1);
});

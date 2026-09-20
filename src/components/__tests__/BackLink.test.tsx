import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BackLink from "../BackLink";

test("renders a link when given a `to`", () => {
  render(<BackLink to="/es" label="Back to Spanish" />);
  const link = screen.getByRole("link", { name: "Back to Spanish" });
  expect(link).toHaveAttribute("href", "/es");
});

test("renders a button when given an onClick, and fires it on click", async () => {
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(<BackLink onClick={onClick} label="Back" />);

  const button = screen.getByRole("button", { name: "Back" });
  await user.click(button);

  expect(onClick).toHaveBeenCalledTimes(1);
});

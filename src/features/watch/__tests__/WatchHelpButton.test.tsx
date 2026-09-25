import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WatchHelpButton from "../WatchHelpButton";

beforeEach(() => {
  window.localStorage.clear();
});

test("renders a trigger and no dialog until it's clicked", () => {
  render(<WatchHelpButton />);
  expect(screen.getByRole("button", { name: /how watch works/i })).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("opens the explainer when clicked", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how watch works/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "How Watch Works" })).toBeInTheDocument();
});

test("closes via the Got it button", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how watch works/i }));
  await user.click(screen.getByRole("button", { name: "Got it" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("closes via the close button", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how watch works/i }));
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("opens on the How to use section, with the others collapsed", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how watch works/i }));
  expect(screen.getByRole("button", { name: "How to use" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "Ranking" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("button", { name: "Liking and disliking" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("switches to the Liking and disliking section", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how watch works/i }));
  await user.click(screen.getByRole("button", { name: "Liking and disliking" }));
  expect(screen.getByRole("button", { name: "Liking and disliking" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(screen.getByRole("button", { name: "How to use" })).toHaveAttribute("aria-expanded", "false");
});

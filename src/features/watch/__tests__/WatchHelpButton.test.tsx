import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WatchHelpButton from "../WatchHelpButton";

const INTRO_SEEN_STORAGE_KEY = "dialectrek-watch-intro-seen";

beforeEach(() => {
  window.localStorage.clear();
});

test("renders a trigger and no dialog until it's clicked", () => {
  render(<WatchHelpButton />);
  expect(screen.getByRole("button", { name: /how rankings work/i })).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("opens the explainer when clicked", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how rankings work/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "How Rankings Work" })).toBeInTheDocument();
});

test("closes via the Got it button", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how rankings work/i }));
  await user.click(screen.getByRole("button", { name: "Got it" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("closes via the close button", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how rankings work/i }));
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

// This popup is independent from WatchIntroModal's daily reminder --
// opening or dismissing it must not silence that separate popup.
test("does not touch the daily intro popup's seen state", async () => {
  const user = userEvent.setup();
  render(<WatchHelpButton />);
  await user.click(screen.getByRole("button", { name: /how rankings work/i }));
  await user.click(screen.getByRole("button", { name: "Got it" }));
  expect(window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY)).toBeNull();
});

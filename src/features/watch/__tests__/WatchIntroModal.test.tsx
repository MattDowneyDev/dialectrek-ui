import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { todayDateString } from "../../../lib/dailyGoal";
import WatchIntroModal from "../WatchIntroModal";

const STORAGE_KEY = "dialectrek-watch-intro-seen";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

test("shows the modal the first time a browser hits the page", () => {
  render(<WatchIntroModal />);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("does not show the modal again later today, once seen", () => {
  window.localStorage.setItem(STORAGE_KEY, todayDateString());
  render(<WatchIntroModal />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("shows the modal again once the stored date is no longer today", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
  window.localStorage.setItem(STORAGE_KEY, todayDateString());

  vi.setSystemTime(new Date(2024, 0, 2, 0, 0, 1));
  render(<WatchIntroModal />);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("dismisses and persists on close button click", async () => {
  const user = userEvent.setup();
  render(<WatchIntroModal />);
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe(todayDateString());
});

test("dismisses on overlay click", async () => {
  const user = userEvent.setup();
  const { container } = render(<WatchIntroModal />);
  const overlay = container.parentElement?.querySelector(".watch-intro-overlay");
  await user.click(overlay as Element);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("clicking inside the modal does not dismiss it", async () => {
  const user = userEvent.setup();
  render(<WatchIntroModal />);
  await user.click(screen.getByRole("heading", { name: "We Need Your Help!" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("dismisses via the Got it button", async () => {
  const user = userEvent.setup();
  render(<WatchIntroModal />);
  await user.click(screen.getByRole("button", { name: "Got it" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("renders into document.body via a portal", () => {
  const { container } = render(<WatchIntroModal />);
  expect(container).toBeEmptyDOMElement();
  expect(document.body.querySelector(".watch-intro-overlay")).toBeInTheDocument();
});

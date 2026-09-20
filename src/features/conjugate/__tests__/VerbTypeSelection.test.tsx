import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import VerbTypeSelection from "../VerbTypeSelection";

test("renders the given prompt as the card title", () => {
  render(<VerbTypeSelection prompt="Do you want irregular verbs?" onYes={vi.fn()} onNo={vi.fn()} />);
  expect(
    screen.getByRole("heading", { name: "Do you want irregular verbs?" }),
  ).toBeInTheDocument();
});

test("calls onYes when Yes is clicked", async () => {
  const user = userEvent.setup();
  const onYes = vi.fn();
  render(<VerbTypeSelection prompt="Prompt?" onYes={onYes} onNo={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Yes" }));
  expect(onYes).toHaveBeenCalledTimes(1);
});

test("calls onNo when No is clicked", async () => {
  const user = userEvent.setup();
  const onNo = vi.fn();
  render(<VerbTypeSelection prompt="Prompt?" onYes={vi.fn()} onNo={onNo} />);
  await user.click(screen.getByRole("button", { name: "No" }));
  expect(onNo).toHaveBeenCalledTimes(1);
});

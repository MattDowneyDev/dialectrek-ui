import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import CategorySelection, { formatCategory } from "../CategorySelection";

test("capitalizes the first letter of a category", () => {
  expect(formatCategory("food")).toBe("Food");
  expect(formatCategory("")).toBe("");
});

test("renders an 'All words' option plus a chip per category", () => {
  render(<CategorySelection categories={["food", "travel"]} onSelect={vi.fn()} />);
  expect(screen.getByRole("button", { name: "All words" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Food" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Travel" })).toBeInTheDocument();
});

test("selecting All words calls onSelect with null", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<CategorySelection categories={["food"]} onSelect={onSelect} />);
  await user.click(screen.getByRole("button", { name: "All words" }));
  expect(onSelect).toHaveBeenCalledWith(null);
});

test("selecting a category calls onSelect with its raw (unformatted) name", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<CategorySelection categories={["food"]} onSelect={onSelect} />);
  await user.click(screen.getByRole("button", { name: "Food" }));
  expect(onSelect).toHaveBeenCalledWith("food");
});

test("renders no category chips when the list is empty", () => {
  render(<CategorySelection categories={[]} onSelect={vi.fn()} />);
  expect(screen.getByRole("button", { name: "All words" })).toBeInTheDocument();
  expect(screen.getAllByRole("button")).toHaveLength(1);
});

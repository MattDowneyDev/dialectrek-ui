import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import CategorySelection, { formatCategory } from "../CategorySelection";

test("capitalizes the first letter of a category", () => {
  expect(formatCategory("food")).toBe("Food");
  expect(formatCategory("")).toBe("");
});

test("renders an 'All words' option plus a card per category", () => {
  render(
    <CategorySelection
      categories={["food", "travel"]}
      categorySelection={[]}
      onToggleCategory={vi.fn()}
      onToggleAllCategories={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "All words" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Food" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Travel" })).toBeInTheDocument();
});

test("clicking All words calls onToggleAllCategories", async () => {
  const user = userEvent.setup();
  const onToggleAllCategories = vi.fn();
  render(
    <CategorySelection
      categories={["food"]}
      categorySelection={[]}
      onToggleCategory={vi.fn()}
      onToggleAllCategories={onToggleAllCategories}
      onConfirm={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "All words" }));
  expect(onToggleAllCategories).toHaveBeenCalledTimes(1);
});

test("clicking a category calls onToggleCategory with its raw (unformatted) name", async () => {
  const user = userEvent.setup();
  const onToggleCategory = vi.fn();
  render(
    <CategorySelection
      categories={["food"]}
      categorySelection={[]}
      onToggleCategory={onToggleCategory}
      onToggleAllCategories={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Food" }));
  expect(onToggleCategory).toHaveBeenCalledWith("food");
});

test("marks selected categories with the selected class, All words only once every category is selected", () => {
  render(
    <CategorySelection
      categories={["food", "travel"]}
      categorySelection={["food"]}
      onToggleCategory={vi.fn()}
      onToggleAllCategories={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Food" })).toHaveClass("selection-card--selected");
  expect(screen.getByRole("button", { name: "Travel" })).not.toHaveClass(
    "selection-card--selected",
  );
  expect(screen.getByRole("button", { name: "All words" })).not.toHaveClass(
    "selection-card--selected",
  );
});

test("marks All words selected once every category is selected", () => {
  render(
    <CategorySelection
      categories={["food", "travel"]}
      categorySelection={["food", "travel"]}
      onToggleCategory={vi.fn()}
      onToggleAllCategories={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "All words" })).toHaveClass(
    "selection-card--selected",
  );
});

test("renders only the 'All words' card (plus Let's go!) when the category list is empty", () => {
  render(
    <CategorySelection
      categories={[]}
      categorySelection={[]}
      onToggleCategory={vi.fn()}
      onToggleAllCategories={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "All words" })).toBeInTheDocument();
  expect(screen.getAllByRole("button")).toHaveLength(2);
});

test("shows a brief description for each category, with a generic fallback for unknown ones", () => {
  render(
    <CategorySelection
      categories={["food/drink", "some-new-category"]}
      categorySelection={[]}
      onToggleCategory={vi.fn()}
      onToggleAllCategories={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(screen.getByText("Food, drink, and dining vocabulary.")).toBeInTheDocument();
  expect(
    screen.getByText('Words from the "Some-new-category" category.'),
  ).toBeInTheDocument();
});

test("disables the confirm button until at least one category is selected", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  const { rerender } = render(
    <CategorySelection
      categories={["food"]}
      categorySelection={[]}
      onToggleCategory={vi.fn()}
      onToggleAllCategories={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  expect(screen.getByRole("button", { name: "Let's go!" })).toBeDisabled();

  rerender(
    <CategorySelection
      categories={["food"]}
      categorySelection={["food"]}
      onToggleCategory={vi.fn()}
      onToggleAllCategories={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  const confirmButton = screen.getByRole("button", { name: "Let's go!" });
  expect(confirmButton).toBeEnabled();
  await user.click(confirmButton);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectionCard, { SelectionGrid } from "../SelectionCard";

test("renders a title and, when given, a description", () => {
  render(<SelectionCard title="Food/drink" description="Food, drink, and dining vocabulary." onClick={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Food/drink" })).toBeInTheDocument();
  expect(screen.getByText("Food, drink, and dining vocabulary.")).toBeInTheDocument();
});

test("omits the description entirely when none is given", () => {
  render(<SelectionCard title="Present" onClick={vi.fn()} />);
  const card = screen.getByRole("button", { name: "Present" });
  expect(card.querySelector(".selection-card-desc")).not.toBeInTheDocument();
});

test("the accessible name is just the title, even with a description present", () => {
  render(<SelectionCard title="Food/drink" description="Food, drink, and dining vocabulary." onClick={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Food/drink" })).toBeInTheDocument();
});

test("calls onClick when clicked", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  render(<SelectionCard title="Present" onClick={onClick} />);
  await user.click(screen.getByRole("button", { name: "Present" }));
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("highlighted and selected apply their own modifier classes, neither by default", () => {
  render(<SelectionCard title="Present" onClick={vi.fn()} />);
  const plain = screen.getByRole("button", { name: "Present" });
  expect(plain).not.toHaveClass("selection-card--highlighted");
  expect(plain).not.toHaveClass("selection-card--selected");

  render(<SelectionCard title="All words" highlighted onClick={vi.fn()} />);
  expect(screen.getByRole("button", { name: "All words" })).toHaveClass(
    "selection-card--highlighted",
  );

  render(<SelectionCard title="Preterite" selected onClick={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Preterite" })).toHaveClass(
    "selection-card--selected",
  );
});

test("SelectionGrid wraps its children in the shared grid layout", () => {
  render(
    <SelectionGrid>
      <SelectionCard title="Present" onClick={vi.fn()} />
    </SelectionGrid>,
  );
  expect(document.querySelector(".selection-grid")).toBeInTheDocument();
});

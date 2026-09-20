import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "../Button";

test("defaults to a primary, type=button button", () => {
  render(<Button>Save</Button>);
  const button = screen.getByRole("button", { name: "Save" });
  expect(button).toHaveAttribute("type", "button");
  expect(button).toHaveClass("btn", "btn-primary");
});

test("applies the requested variant", () => {
  render(<Button variant="outline">Cancel</Button>);
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("btn-outline");
});

test("merges a custom className with the variant class", () => {
  render(<Button className="extra-class">Go</Button>);
  const button = screen.getByRole("button", { name: "Go" });
  expect(button).toHaveClass("btn", "btn-primary", "extra-class");
});

test("respects an explicit type and forwards other native props", async () => {
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(
    <Button type="submit" onClick={onClick} disabled>
      Submit
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Submit" });
  expect(button).toHaveAttribute("type", "submit");
  expect(button).toBeDisabled();

  await user.click(button);
  expect(onClick).not.toHaveBeenCalled();
});

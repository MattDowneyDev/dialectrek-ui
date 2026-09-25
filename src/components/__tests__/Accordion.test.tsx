import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Accordion from "../Accordion";

const items = [
  { id: "one", title: "First", content: <p>First body</p> },
  { id: "two", title: "Second", content: <p>Second body</p> },
];

const trigger = (name: string) => screen.getByRole("button", { name });

test("starts collapsed when no defaultOpenId is given", () => {
  render(<Accordion items={items} />);
  expect(trigger("First")).toHaveAttribute("aria-expanded", "false");
  expect(trigger("Second")).toHaveAttribute("aria-expanded", "false");
});

test("opens the defaultOpenId section on mount", () => {
  render(<Accordion items={items} defaultOpenId="one" />);
  expect(trigger("First")).toHaveAttribute("aria-expanded", "true");
  expect(trigger("Second")).toHaveAttribute("aria-expanded", "false");
});

test("opening a section closes the one that was open", async () => {
  const user = userEvent.setup();
  render(<Accordion items={items} defaultOpenId="one" />);
  await user.click(trigger("Second"));
  expect(trigger("First")).toHaveAttribute("aria-expanded", "false");
  expect(trigger("Second")).toHaveAttribute("aria-expanded", "true");
});

test("clicking the open section collapses it", async () => {
  const user = userEvent.setup();
  render(<Accordion items={items} defaultOpenId="one" />);
  await user.click(trigger("First"));
  expect(trigger("First")).toHaveAttribute("aria-expanded", "false");
});

test("wires each trigger to its panel", () => {
  render(<Accordion items={items} defaultOpenId="one" />);
  const panelId = trigger("First").getAttribute("aria-controls")!;
  const panel = document.getElementById(panelId)!;
  expect(panel).toHaveTextContent("First body");
  expect(panel).not.toHaveAttribute("inert");
  const closedPanel = document.getElementById(trigger("Second").getAttribute("aria-controls")!)!;
  expect(closedPanel).toHaveAttribute("inert");
});

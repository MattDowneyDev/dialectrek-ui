import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect } from "vitest";
import VerbsList from "../VerbsList";
import type { VerbEntry } from "../../../languages/types";

const verbs: VerbEntry[] = [
  ["hablar", "to speak"],
  ["être", "to be"],
  ["comer", "to eat"],
];

test("renders every verb as a link to its detail page", () => {
  render(<VerbsList code="es" verbs={verbs} />);
  expect(screen.getByText("hablar")).toBeInTheDocument();
  expect(screen.getByText("to speak")).toBeInTheDocument();
  const link = screen.getByText("hablar").closest("a");
  expect(link).toHaveAttribute("href", "/es/verbs/hablar");
});

test("percent-encodes verb targets with special characters in the link href", () => {
  render(<VerbsList code="fr" verbs={verbs} />);
  const link = screen.getByText("être").closest("a");
  expect(link).toHaveAttribute("href", `/fr/verbs/${encodeURIComponent("être")}`);
});

test("shows an empty state when there are no verbs at all", () => {
  render(<VerbsList code="es" verbs={[]} />);
  expect(screen.getByText("No verbs found.")).toBeInTheDocument();
});

test("filters verbs by the target word as the user types", async () => {
  const user = userEvent.setup();
  render(<VerbsList code="es" verbs={verbs} />);
  await user.type(screen.getByPlaceholderText("Search verbs..."), "hab");
  expect(screen.getByText("hablar")).toBeInTheDocument();
  expect(screen.queryByText("comer")).not.toBeInTheDocument();
});

test("filters verbs by their english translation too", async () => {
  const user = userEvent.setup();
  render(<VerbsList code="es" verbs={verbs} />);
  await user.type(screen.getByPlaceholderText("Search verbs..."), "eat");
  expect(screen.getByText("comer")).toBeInTheDocument();
  expect(screen.queryByText("hablar")).not.toBeInTheDocument();
});

test("matches accented verbs from a plain, unaccented query", async () => {
  const user = userEvent.setup();
  render(<VerbsList code="fr" verbs={verbs} />);
  await user.type(screen.getByPlaceholderText("Search verbs..."), "etre");
  expect(screen.getByText("être")).toBeInTheDocument();
  expect(screen.queryByText("hablar")).not.toBeInTheDocument();
});

test("shows the empty state once a search matches nothing", async () => {
  const user = userEvent.setup();
  render(<VerbsList code="es" verbs={verbs} />);
  await user.type(screen.getByPlaceholderText("Search verbs..."), "xyz");
  expect(screen.getByText("No verbs found.")).toBeInTheDocument();
});

test("clearing the search restores the full list", async () => {
  const user = userEvent.setup();
  render(<VerbsList code="es" verbs={verbs} />);
  const input = screen.getByPlaceholderText("Search verbs...");
  await user.type(input, "hab");
  await user.clear(input);
  expect(screen.getByText("comer")).toBeInTheDocument();
});

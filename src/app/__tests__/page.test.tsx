import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguagePickerPage, { metadata } from "../page";

test("renders a link to each language in the registry", () => {
  render(<LanguagePickerPage />);
  expect(screen.getByRole("link", { name: "Spanish" })).toHaveAttribute("href", "/es");
  expect(screen.getByRole("link", { name: "French" })).toHaveAttribute("href", "/fr");
});

test("renders the hero heading and feature list", () => {
  render(<LanguagePickerPage />);
  expect(screen.getByRole("heading", { name: "DialecTrek", level: 1 })).toBeInTheDocument();
  expect(screen.getByText("Watch videos")).toBeInTheDocument();
  expect(screen.getByText("Look up verbs")).toBeInTheDocument();
  expect(screen.getByText("Conjugate verbs")).toBeInTheDocument();
  expect(screen.getByText("Study flashcards")).toBeInTheDocument();
  expect(screen.getByText("Learn grammar")).toBeInTheDocument();
});

test("sets page metadata with an absolute title", () => {
  expect(metadata.title).toEqual({ absolute: "DialecTrek — Learn a Language" });
  expect(metadata.description).toContain("DialecTrek");
  expect(metadata.alternates?.canonical).toBe("/");
});

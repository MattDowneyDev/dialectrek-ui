import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage, { generateMetadata } from "../page";

test("renders the language hero and action cards for a known language", async () => {
  const element = await HomePage({ params: Promise.resolve({ language: "es" }) });
  render(element);
  expect(screen.getByRole("heading", { name: "Spanish", level: 1 })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Watch videos/ })).toHaveAttribute(
    "href",
    "/es/watch",
  );
  expect(screen.getByRole("link", { name: /Look up verbs/ })).toHaveAttribute(
    "href",
    "/es/verbs",
  );
  expect(screen.getByText("Browse the verb list and find a conjugation fast.")).toBeInTheDocument();
});

test("returns null for an unknown language", async () => {
  const element = await HomePage({ params: Promise.resolve({ language: "de" }) });
  expect(element).toBeNull();
});

test("generates metadata for a known language", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "fr" }) });
  expect(metadata.title).toBe("Learn French");
  expect(metadata.alternates?.canonical).toBe("/fr");
});

test("returns empty metadata for an unknown language", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "de" }) });
  expect(metadata).toEqual({});
});

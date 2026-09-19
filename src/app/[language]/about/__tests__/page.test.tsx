import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AboutPage, { generateMetadata } from "../page";

test("renders the about content for a known language", async () => {
  const element = await AboutPage({ params: Promise.resolve({ language: "es" }) });
  render(element);
  expect(screen.getByRole("heading", { name: "About DialecTrek", level: 1 })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Learn through comprehensible input" }),
  ).toBeInTheDocument();
});

test("returns null for an unknown language", async () => {
  const element = await AboutPage({ params: Promise.resolve({ language: "de" }) });
  expect(element).toBeNull();
});

test("generates metadata for a known language", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "fr" }) });
  expect(metadata.title).toBe("About DialecTrek");
  expect(metadata.alternates?.canonical).toBe("/fr/about");
});

test("returns empty metadata for an unknown language", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ language: "de" }) });
  expect(metadata).toEqual({});
});

import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage, { metadata } from "../page";

test("renders the privacy policy content", () => {
  render(<PrivacyPage />);
  expect(screen.getByRole("heading", { name: "Privacy Policy", level: 1 })).toBeInTheDocument();
  expect(screen.getByText("Last updated August 2026")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "What we collect" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Google Privacy Policy" })).toHaveAttribute(
    "href",
    "https://policies.google.com/privacy",
  );
});

test("sets privacy page metadata", () => {
  expect(metadata.title).toBe("Privacy Policy");
  expect(metadata.alternates?.canonical).toBe("/privacy");
});

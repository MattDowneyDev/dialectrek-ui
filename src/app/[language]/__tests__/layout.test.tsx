import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageLayout from "../layout";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const { redirect } = await import("next/navigation");

test("renders children for a known, enabled language", async () => {
  const element = await LanguageLayout({
    children: <div data-testid="child" />,
    params: Promise.resolve({ language: "es" }),
  });
  render(element);
  expect(screen.getByTestId("child")).toBeInTheDocument();
  expect(redirect).not.toHaveBeenCalled();
});

test("redirects home for an unknown language", async () => {
  await expect(
    LanguageLayout({
      children: <div data-testid="child" />,
      params: Promise.resolve({ language: "de" }),
    }),
  ).rejects.toThrow("NEXT_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/");
});

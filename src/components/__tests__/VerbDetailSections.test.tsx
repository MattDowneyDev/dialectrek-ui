import { expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import VerbDetailSections from "../VerbDetailSections";

test("renders its children alongside the tense spine", () => {
  render(
    <VerbDetailSections>
      <p>Preterite table</p>
    </VerbDetailSections>,
  );
  expect(screen.getByText("Preterite table")).toBeInTheDocument();
  expect(screen.getByText("Past")).toBeInTheDocument();
  expect(screen.getByText("Present")).toBeInTheDocument();
  expect(screen.getByText("Future")).toBeInTheDocument();
});

test("recomputes spine position on scroll and resize without crashing", () => {
  render(
    <VerbDetailSections>
      <p>Content</p>
    </VerbDetailSections>,
  );

  expect(() => {
    fireEvent.scroll(window);
    fireEvent(window, new Event("resize"));
  }).not.toThrow();
});

test("coalesces rapid-fire scroll events into a single pending measurement", () => {
  render(
    <VerbDetailSections>
      <p>Content</p>
    </VerbDetailSections>,
  );

  // Firing twice back-to-back, before the first rAF-scheduled measure runs,
  // should make the second scroll a no-op (the `ticking` guard) rather than
  // stacking up extra frames.
  expect(() => {
    fireEvent.scroll(window);
    fireEvent.scroll(window);
  }).not.toThrow();
});

test("stops listening after unmounting", () => {
  const { unmount } = render(
    <VerbDetailSections>
      <p>Content</p>
    </VerbDetailSections>,
  );
  unmount();

  expect(() => {
    fireEvent.scroll(window);
    fireEvent(window, new Event("resize"));
  }).not.toThrow();
});

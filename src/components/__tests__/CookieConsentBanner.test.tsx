import { beforeEach, expect, test } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CONSENT_STORAGE_KEY,
  OPEN_COOKIE_PREFERENCES_EVENT,
} from "../../lib/consent";
import CookieConsentBanner from "../CookieConsentBanner";

beforeEach(() => {
  window.localStorage.clear();
});

test("shows the banner when no consent choice has been stored yet", () => {
  render(<CookieConsentBanner />);
  expect(screen.getByRole("dialog", { name: "Cookie consent" })).toBeInTheDocument();
});

test("stays hidden when a consent choice is already stored", () => {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
  render(<CookieConsentBanner />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("accepting stores 'granted', applies it, and hides the banner", async () => {
  const user = userEvent.setup();
  render(<CookieConsentBanner />);

  await user.click(screen.getByRole("button", { name: "Accept" }));

  expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("granted");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("declining stores 'denied' and hides the banner", async () => {
  const user = userEvent.setup();
  render(<CookieConsentBanner />);

  await user.click(screen.getByRole("button", { name: "Decline" }));

  expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("denied");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("reopens when the open-cookie-preferences event fires", () => {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
  render(<CookieConsentBanner />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  act(() => {
    window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT));
  });

  expect(
    screen.getByRole("dialog", { name: "Cookie consent" }),
  ).toBeInTheDocument();
});

test("stops listening for the reopen event after unmounting", () => {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
  const { unmount } = render(<CookieConsentBanner />);
  unmount();

  expect(() =>
    window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT)),
  ).not.toThrow();
});

test("links to the privacy policy", () => {
  render(<CookieConsentBanner />);
  expect(screen.getByRole("link", { name: "privacy policy" })).toHaveAttribute(
    "href",
    "/privacy",
  );
});

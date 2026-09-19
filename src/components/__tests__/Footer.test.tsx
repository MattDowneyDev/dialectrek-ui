import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OPEN_COOKIE_PREFERENCES_EVENT } from "../../lib/consent";
import Footer from "../Footer";

test("renders the brand and a privacy policy link", () => {
  render(<Footer />);
  expect(screen.getByText("DialecTrek")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
    "href",
    "/privacy",
  );
});

test("dispatches the open-cookie-preferences event when clicked", async () => {
  const listener = vi.fn();
  window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, listener);
  const user = userEvent.setup();

  render(<Footer />);
  await user.click(screen.getByRole("button", { name: "Cookie preferences" }));

  expect(listener).toHaveBeenCalledTimes(1);
  window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, listener);
});

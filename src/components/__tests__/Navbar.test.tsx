import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "../../context/ThemeContext";
import Navbar from "../Navbar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

const renderNavbar = () =>
  render(
    <ThemeProvider>
      <Navbar />
    </ThemeProvider>,
  );

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/");
});

test("shows only the brand and theme toggle when there's no active language", () => {
  renderNavbar();
  expect(screen.getByRole("link", { name: /DialecTrek/ })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("link", { name: "Verbs" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Toggle navigation" })).not.toBeInTheDocument();
});

test("shows no language links for a language that isn't enabled", () => {
  vi.mocked(usePathname).mockReturnValue("/xx/verbs");
  renderNavbar();
  expect(screen.queryByRole("link", { name: "Verbs" })).not.toBeInTheDocument();
});

test("shows the full link set for an enabled language", () => {
  vi.mocked(usePathname).mockReturnValue("/es");
  renderNavbar();

  for (const label of ["Watch", "Verbs", "Conjugate", "Grammar", "Flashcards", "About"]) {
    expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole("link", { name: "Verbs" })).toHaveAttribute("href", "/es/verbs");
});

test("marks the exact-match link as active", () => {
  vi.mocked(usePathname).mockReturnValue("/es/verbs");
  renderNavbar();
  expect(screen.getByRole("link", { name: "Verbs" })).toHaveClass("active");
  expect(screen.getByRole("link", { name: "Conjugate" })).not.toHaveClass("active");
});

test("marks a link active for a nested path under it", () => {
  vi.mocked(usePathname).mockReturnValue("/es/verbs/ir");
  renderNavbar();
  expect(screen.getByRole("link", { name: "Verbs" })).toHaveClass("active");
});

test("toggles the mobile menu open and closed", async () => {
  vi.mocked(usePathname).mockReturnValue("/es");
  const user = userEvent.setup();
  renderNavbar();

  const toggle = screen.getByRole("button", { name: "Toggle navigation" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");

  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");

  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("closes the mobile menu when a nav link is clicked", async () => {
  vi.mocked(usePathname).mockReturnValue("/es");
  const user = userEvent.setup();
  renderNavbar();

  await user.click(screen.getByRole("button", { name: "Toggle navigation" }));
  expect(screen.getByRole("button", { name: "Toggle navigation" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  await user.click(screen.getByRole("link", { name: "Verbs" }));
  expect(screen.getByRole("button", { name: "Toggle navigation" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("closes the mobile menu when the brand link is clicked", async () => {
  vi.mocked(usePathname).mockReturnValue("/es");
  const user = userEvent.setup();
  renderNavbar();

  await user.click(screen.getByRole("button", { name: "Toggle navigation" }));
  await user.click(screen.getByRole("link", { name: /DialecTrek/ }));
  expect(screen.getByRole("button", { name: "Toggle navigation" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("closes the mobile menu when clicking outside the nav", async () => {
  vi.mocked(usePathname).mockReturnValue("/es");
  const user = userEvent.setup();
  renderNavbar();

  await user.click(screen.getByRole("button", { name: "Toggle navigation" }));
  expect(screen.getByRole("button", { name: "Toggle navigation" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  await user.click(document.body);
  expect(screen.getByRole("button", { name: "Toggle navigation" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("does not close the mobile menu when clicking inside the nav", async () => {
  vi.mocked(usePathname).mockReturnValue("/es");
  const user = userEvent.setup();
  renderNavbar();

  const toggle = screen.getByRole("button", { name: "Toggle navigation" });
  await user.click(toggle);
  await user.click(screen.getByRole("link", { name: "About" }).closest("nav") as HTMLElement);
  // clicking the nav container itself (not a link) shouldn't be swallowed by the outside-click handler
  expect(toggle).toHaveAttribute("aria-expanded", "true");
});

test("toggles the theme and updates the toggle button's label", async () => {
  vi.mocked(usePathname).mockReturnValue("/");
  const user = userEvent.setup();
  renderNavbar();

  const themeToggle = screen.getByRole("button", { name: "Switch to dark mode" });
  await user.click(themeToggle);
  expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
});

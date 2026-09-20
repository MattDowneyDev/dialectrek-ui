import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import Navbar from "../Navbar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

const renderNavbar = () => render(<Navbar />);

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/");
});

test("shows only the brand when there's no active language", () => {
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

test("shows no language switcher when there's no active language", () => {
  renderNavbar();
  expect(screen.queryByRole("button", { name: "Switch language" })).not.toBeInTheDocument();
});

test("shows a language switcher listing the other enabled languages", async () => {
  vi.mocked(usePathname).mockReturnValue("/es/verbs");
  const user = userEvent.setup();
  renderNavbar();

  await user.click(screen.getByRole("button", { name: "Switch language" }));

  const frenchLink = screen.getByRole("link", { name: /French/ });
  expect(frenchLink).toHaveAttribute("href", "/fr/verbs");
  expect(screen.queryByRole("link", { name: /Spanish/ })).not.toBeInTheDocument();
});

test("switches to a language's home page when there's no section in the path", async () => {
  vi.mocked(usePathname).mockReturnValue("/es");
  const user = userEvent.setup();
  renderNavbar();

  await user.click(screen.getByRole("button", { name: "Switch language" }));
  expect(screen.getByRole("link", { name: /French/ })).toHaveAttribute("href", "/fr");
});

test("closes the language dropdown after picking a language", async () => {
  vi.mocked(usePathname).mockReturnValue("/es/verbs");
  const user = userEvent.setup();
  renderNavbar();

  await user.click(screen.getByRole("button", { name: "Switch language" }));
  await user.click(screen.getByRole("link", { name: /French/ }));
  expect(screen.queryByRole("link", { name: /French/ })).not.toBeInTheDocument();
});


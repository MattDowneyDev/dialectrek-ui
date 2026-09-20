import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "../../context/ThemeContext";
import ThemeToggle from "../ThemeToggle";

const renderThemeToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );

test("toggles the theme and updates the toggle button's label", async () => {
  const user = userEvent.setup();
  renderThemeToggle();

  const toggle = screen.getByRole("button", { name: "Switch to dark mode" });
  await user.click(toggle);
  expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
});

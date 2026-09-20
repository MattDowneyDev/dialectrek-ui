import { test, expect } from "vitest";
import { render } from "@testing-library/react";
import Confetti from "../Confetti";

test("renders a hidden container with 70 confetti pieces", () => {
  const { container } = render(<Confetti />);
  const wrapper = container.querySelector(".confetti-container");
  expect(wrapper).toHaveAttribute("aria-hidden", "true");
  expect(wrapper?.querySelectorAll(".confetti-piece")).toHaveLength(70);
});

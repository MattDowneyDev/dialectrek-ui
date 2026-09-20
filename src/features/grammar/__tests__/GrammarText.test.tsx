import { test, expect } from "vitest";
import { render } from "@testing-library/react";
import GrammarText from "../GrammarText";

test("renders a plain span for a part with no tone", () => {
  const { container } = render(<GrammarText parts={[{ text: "hola" }]} />);
  expect(container.querySelector("span")?.textContent).toBe("hola");
  expect(container.querySelector("b")).not.toBeInTheDocument();
});

test("renders a bold, toned element for a part with a tone", () => {
  const { container } = render(<GrammarText parts={[{ text: "fui", tone: "a" }]} />);
  const bold = container.querySelector("b");
  expect(bold?.textContent).toBe("fui");
  expect(bold).toHaveClass("grammar-tone-a");
});

test("renders a mix of toned and plain parts in order", () => {
  const { container } = render(
    <GrammarText
      parts={[{ text: "Yo " }, { text: "fui", tone: "a" }, { text: " a la tienda" }]}
    />,
  );
  expect(container.textContent).toBe("Yo fui a la tienda");
  expect(container.querySelectorAll("b")).toHaveLength(1);
  expect(container.querySelectorAll("span")).toHaveLength(2);
});

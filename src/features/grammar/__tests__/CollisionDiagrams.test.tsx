import { test, expect } from "vitest";
import { render } from "@testing-library/react";
import { collisionDiagrams } from "../CollisionDiagrams";

const slugs = Object.keys(collisionDiagrams);

test("exposes a diagram for every documented collision slug", () => {
  expect(slugs).toEqual([
    "preterite-vs-imperfect",
    "ser-vs-estar",
    "subjunctive-triggers",
    "por-vs-para",
    "object-pronoun-placement",
    "personal-a",
    "gustar-type-verbs",
    "etre-vs-avoir",
    "object-pronoun-order",
    "partitive-articles",
    "gender-adjective-agreement",
  ]);
});

test.each(slugs)("renders a labeled svg for %s", (slug) => {
  const Diagram = collisionDiagrams[slug];
  const { container } = render(<Diagram />);
  const svg = container.querySelector("svg.grammar-collision-diagram");
  expect(svg).toBeInTheDocument();
  expect(svg).toHaveAttribute("role", "img");
  expect(svg?.getAttribute("aria-label")).toBeTruthy();
});

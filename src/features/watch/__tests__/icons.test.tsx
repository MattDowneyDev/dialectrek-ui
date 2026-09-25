import { test, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChevronDownIcon } from "../../../components/icons";
import { InfoIcon, PlayIcon, ThumbsDownIcon, ThumbsUpIcon } from "../icons";

test("PlayIcon renders an svg", () => {
  const { container } = render(<PlayIcon />);
  expect(container.querySelector("svg")).toBeInTheDocument();
});

test("ChevronDownIcon renders an svg", () => {
  const { container } = render(<ChevronDownIcon />);
  expect(container.querySelector("svg")).toBeInTheDocument();
});

test("InfoIcon renders an svg", () => {
  const { container } = render(<InfoIcon />);
  expect(container.querySelector("svg")).toBeInTheDocument();
});

test("ThumbsUpIcon fills when filled is true", () => {
  const { container } = render(<ThumbsUpIcon filled />);
  expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
});

test("ThumbsUpIcon is outlined when filled is false", () => {
  const { container } = render(<ThumbsUpIcon filled={false} />);
  expect(container.querySelector("svg")).toHaveAttribute("fill", "none");
});

test("ThumbsDownIcon fills when filled is true", () => {
  const { container } = render(<ThumbsDownIcon filled />);
  expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
});

test("ThumbsDownIcon is outlined when filled is false", () => {
  const { container } = render(<ThumbsDownIcon filled={false} />);
  expect(container.querySelector("svg")).toHaveAttribute("fill", "none");
});

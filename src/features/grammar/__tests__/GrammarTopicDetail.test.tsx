import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GrammarTopicDetail from "../GrammarTopicDetail";
import type { GrammarTopic } from "../../../languages/types";

const baseTopic: GrammarTopic = {
  slug: "ser-vs-estar",
  title: "Ser vs. Estar",
  summary: "Two ways to say 'to be'.",
  lede: "Spanish splits 'to be' into two verbs.",
  quickTake: [{ text: "Ser is for " }, { text: "permanent", tone: "a" }, { text: " traits." }],
  compare: [
    {
      label: "Ser",
      kicker: "Permanent",
      triggers: ["identity", "origin"],
      examples: [{ parts: [{ text: "Soy alto.", tone: "a" }], gloss: "I am tall.", why: "A trait." }],
    },
    {
      label: "Estar",
      kicker: "Temporary",
      triggers: ["mood", "location"],
      examples: [{ parts: [{ text: "Estoy cansado.", tone: "b" }], gloss: "I am tired.", why: "A state." }],
    },
  ],
  collision: {
    parts: [{ text: "Está " }, { text: "rico", tone: "b" }],
    gloss: "It tastes good (right now).",
    note: "Same adjective, different meaning depending on the verb.",
  },
  shiftTableIntro: "Some verbs shift meaning between the two tenses.",
  shiftTable: [
    {
      verb: "saber",
      formB: { form: "sabía", meaning: "knew" },
      formA: { form: "supe", meaning: "found out" },
    },
  ],
  quiz: [
    {
      before: "Ella ",
      after: " feliz hoy.",
      infinitive: "estar",
      correctTone: "b",
      correctForm: "está",
      explanation: "A temporary mood.",
    },
  ],
  quizCta: { heading: "Ready to practice?", body: "See how well you know it.", buttonLabel: "Start" },
};

test("renders the lede and quick take", () => {
  render(<GrammarTopicDetail topic={baseTopic} />);
  expect(screen.getByText(baseTopic.lede)).toBeInTheDocument();
  expect(screen.getByText("The short version")).toBeInTheDocument();
  expect(screen.getByText("permanent")).toHaveClass("grammar-tone-a");
});

test("renders both sides of the comparison with their triggers and examples", () => {
  render(<GrammarTopicDetail topic={baseTopic} />);
  expect(screen.getByRole("heading", { name: "Ser" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Estar" })).toBeInTheDocument();
  expect(screen.getByText("identity")).toBeInTheDocument();
  expect(screen.getByText("I am tall.")).toBeInTheDocument();
  expect(screen.getByText("A state.")).toBeInTheDocument();
});

test("renders the collision section with its diagram when the slug has one", () => {
  const { container } = render(<GrammarTopicDetail topic={baseTopic} />);
  expect(screen.getByText("Where it gets interesting")).toBeInTheDocument();
  expect(screen.getByText(baseTopic.collision!.gloss)).toBeInTheDocument();
  expect(screen.getByText(baseTopic.collision!.note)).toBeInTheDocument();
  expect(container.querySelector("svg.grammar-collision-diagram")).toBeInTheDocument();
});

test("omits the collision section entirely when the topic has none", () => {
  const topic: GrammarTopic = { ...baseTopic, collision: undefined };
  render(<GrammarTopicDetail topic={topic} />);
  expect(screen.queryByText("Where it gets interesting")).not.toBeInTheDocument();
});

test("renders a collision without a matching diagram entry gracefully", () => {
  const topic: GrammarTopic = { ...baseTopic, slug: "no-diagram-for-this-one" };
  const { container } = render(<GrammarTopicDetail topic={topic} />);
  expect(screen.getByText("Where it gets interesting")).toBeInTheDocument();
  expect(container.querySelector("svg.grammar-collision-diagram")).not.toBeInTheDocument();
});

test("renders the verb shift table when present", () => {
  render(<GrammarTopicDetail topic={baseTopic} />);
  expect(screen.getByText("Verbs that change meaning")).toBeInTheDocument();
  expect(screen.getByText(baseTopic.shiftTableIntro!)).toBeInTheDocument();
  expect(screen.getByText("saber")).toBeInTheDocument();
  expect(screen.getByText("sabía")).toBeInTheDocument();
  expect(screen.getByText("supe")).toBeInTheDocument();
});

test("omits the shift table when it's absent or empty", () => {
  const topic: GrammarTopic = { ...baseTopic, shiftTable: [] };
  render(<GrammarTopicDetail topic={topic} />);
  expect(screen.queryByText("Verbs that change meaning")).not.toBeInTheDocument();
});

test("omits the shift table intro paragraph when not provided", () => {
  const topic: GrammarTopic = { ...baseTopic, shiftTableIntro: undefined };
  render(<GrammarTopicDetail topic={topic} />);
  expect(screen.getByText("Verbs that change meaning")).toBeInTheDocument();
  expect(screen.queryByText("Some verbs shift meaning between the two tenses.")).not.toBeInTheDocument();
});

test("renders the quiz CTA when quiz questions are present", () => {
  render(<GrammarTopicDetail topic={baseTopic} />);
  expect(screen.getByText("Ready to practice?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
});

test("omits the quiz section when there are no quiz questions", () => {
  const topic: GrammarTopic = { ...baseTopic, quiz: [] };
  render(<GrammarTopicDetail topic={topic} />);
  expect(screen.queryByText("Ready to practice?")).not.toBeInTheDocument();
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import ConjugationInput from "../ConjugationInput";
import type { Tense, VerbConjugation } from "../../../languages/types";

const tenseLabels: Record<Tense, string> = {
  present: "Present",
  preterite: "Preterite",
  imperfect: "Imperfect",
  perfect: "Present Perfect",
  future: "Future",
  future_perfect: "Future Perfect",
  conditional: "Conditional",
  conditional_perfect: "Conditional Perfect",
  preterite_perfect: "Preterite Perfect",
  pluperfect: "Pluperfect",
  imperative: "Imperative",
};

const baseVerb: VerbConjugation = {
  form_english: "I speak",
  form_target: "hablo",
  pronoun_english: "I",
  infinitive_target: "hablar",
  mood: "indicative",
  tense: "present",
};

const baseProps = {
  tenseLabels,
  accentChars: ["á", "é"],
  handleInputChange: vi.fn(),
  handleSubmitGuess: vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault()),
  isCorrectAnswer: "",
  fetchRandomVerbConjugation: vi.fn(),
  userGuess: "",
  showHint: false,
  onShowHint: vi.fn(),
  showAnswer: false,
  onShowAnswer: vi.fn(),
  questionKey: 0,
};

test("shows a placeholder word when there is no verb yet", () => {
  render(<ConjugationInput {...baseProps} randomVerb={null} />);
  expect(screen.getByText("...")).toBeInTheDocument();
});

test("renders the tense and mood badges, pronoun, and english prompt", () => {
  render(<ConjugationInput {...baseProps} randomVerb={baseVerb} />);
  expect(screen.getByText("Present")).toBeInTheDocument();
  expect(screen.getByText("Indicative")).toBeInTheDocument();
  expect(screen.getByText("I")).toBeInTheDocument();
  expect(screen.getByText("I speak")).toBeInTheDocument();
});

test("renders a Subjunctive mood badge and the (that) marker for subjunctive verbs", () => {
  render(
    <ConjugationInput
      {...baseProps}
      randomVerb={{ ...baseVerb, mood: "subjunctive", tense: "imperfect" }}
    />,
  );
  expect(screen.getByText("Subjunctive")).toBeInTheDocument();
  expect(screen.getByText("(that)")).toBeInTheDocument();
});

test("shows an Affirmative/Negative polarity badge (not a mood badge) for the imperative, with no (that) marker", () => {
  render(
    <ConjugationInput
      {...baseProps}
      randomVerb={{ ...baseVerb, tense: "imperative", mood: "subjunctive", polarity: "negative" }}
    />,
  );
  expect(screen.getByText("Negative")).toBeInTheDocument();
  expect(screen.queryByText("Subjunctive")).not.toBeInTheDocument();
  expect(screen.queryByText("(that)")).not.toBeInTheDocument();
});

test("shows an Affirmative badge for the imperative's affirmative polarity", () => {
  render(
    <ConjugationInput
      {...baseProps}
      randomVerb={{ ...baseVerb, tense: "imperative", polarity: "affirmative" }}
    />,
  );
  expect(screen.getByText("Affirmative")).toBeInTheDocument();
});

test("renders no badges at all when the verb has neither a tense nor a mood", () => {
  render(<ConjugationInput {...baseProps} randomVerb={{ form_english: "to run" }} />);
  expect(document.querySelector(".quiz-badges")).not.toBeInTheDocument();
});

test("typing into the input calls handleInputChange", async () => {
  const user = userEvent.setup();
  const handleInputChange = vi.fn();
  render(
    <ConjugationInput {...baseProps} randomVerb={baseVerb} handleInputChange={handleInputChange} />,
  );
  await user.type(screen.getByPlaceholderText("Enter your translation"), "h");
  expect(handleInputChange).toHaveBeenCalled();
});

test("submitting the form calls handleSubmitGuess", async () => {
  const user = userEvent.setup();
  const handleSubmitGuess = vi.fn((event: React.FormEvent<HTMLFormElement>) =>
    event.preventDefault(),
  );
  render(
    <ConjugationInput
      {...baseProps}
      randomVerb={baseVerb}
      userGuess="hablo"
      handleSubmitGuess={handleSubmitGuess}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Check Answer" }));
  expect(handleSubmitGuess).toHaveBeenCalledTimes(1);
});

test("clicking an accent character inserts it into the input at the cursor", async () => {
  const user = userEvent.setup();
  const handleInputChange = vi.fn();
  render(
    <ConjugationInput
      {...baseProps}
      randomVerb={baseVerb}
      userGuess="hablo"
      handleInputChange={handleInputChange}
    />,
  );
  const input = screen.getByPlaceholderText("Enter your translation") as HTMLInputElement;
  input.setSelectionRange(input.value.length, input.value.length);
  await user.click(screen.getByRole("button", { name: "á" }));
  expect(handleInputChange).toHaveBeenCalled();
  const event = handleInputChange.mock.calls[0][0];
  expect(event.target.value).toBe("habloá");
});

test("locks the input and hides the toolbar/submit button once the answer is correct", () => {
  render(<ConjugationInput {...baseProps} randomVerb={baseVerb} isCorrectAnswer="true" />);
  expect(screen.getByPlaceholderText("Enter your translation")).toHaveAttribute("readonly");
  expect(screen.queryByRole("button", { name: "Check Answer" })).not.toBeInTheDocument();
  // The toolbar stays mounted (it reserves its row's height even once
  // locked) but is visually hidden rather than removed -- see
  // ConjugationInput's accent-toolbar comment.
  expect(document.querySelector(".accent-toolbar")).toHaveClass("accent-toolbar--hidden");
  // Result now reads off an icon inline with the input rather than a
  // separate banner -- see ConjugationInput's quiz-input-icon comment.
  expect(document.querySelector(".quiz-input-icon")).toHaveClass("correct");
  expect(screen.getByRole("status")).toHaveTextContent("Correct!");
});

test("marks the input incorrect and shows an inline result icon", () => {
  render(<ConjugationInput {...baseProps} randomVerb={baseVerb} isCorrectAnswer="false" />);
  expect(screen.getByPlaceholderText("Enter your translation")).toHaveClass("incorrect");
  expect(document.querySelector(".quiz-input-icon")).toHaveClass("incorrect");
  expect(screen.getByRole("status")).toHaveTextContent("Incorrect");
});

test("shows a Show Hint button from the start, alongside Check Answer, which becomes Show Answer once clicked", async () => {
  const user = userEvent.setup();
  const onShowHint = vi.fn();
  render(
    <ConjugationInput {...baseProps} randomVerb={baseVerb} onShowHint={onShowHint} />,
  );
  // Available before any guess has even been attempted -- someone who
  // doesn't know the verb at all shouldn't have to miss once first.
  expect(screen.getByRole("button", { name: "Check Answer" })).toBeInTheDocument();
  const hintButton = screen.getByRole("button", { name: "Show Hint" });
  await user.click(hintButton);
  expect(onShowHint).toHaveBeenCalledTimes(1);
});

test("clicking Show Answer (once a hint is already showing) calls onShowAnswer", async () => {
  const user = userEvent.setup();
  const onShowAnswer = vi.fn();
  render(
    <ConjugationInput
      {...baseProps}
      randomVerb={baseVerb}
      isCorrectAnswer="false"
      showHint
      onShowAnswer={onShowAnswer}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Show Answer" }));
  expect(onShowAnswer).toHaveBeenCalledTimes(1);
});

test("shows the hint text with the infinitive once showHint is true", () => {
  render(<ConjugationInput {...baseProps} randomVerb={baseVerb} showHint />);
  expect(screen.getByText("hablar")).toBeInTheDocument();
});

test("shows the answer, including an alt form, and hides the hint/answer buttons once showAnswer is true", () => {
  render(
    <ConjugationInput
      {...baseProps}
      randomVerb={{ ...baseVerb, form_target_alt: "hablás" }}
      isCorrectAnswer="false"
      showAnswer
    />,
  );
  expect(screen.getByText("hablo")).toBeInTheDocument();
  expect(screen.getByText("hablás")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Show/ })).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("Enter your translation")).toHaveAttribute("readonly");
});

test("does not show a hint button once the answer has been revealed", () => {
  render(
    <ConjugationInput {...baseProps} randomVerb={baseVerb} isCorrectAnswer="false" showAnswer />,
  );
  expect(screen.queryByRole("button", { name: "Show Hint" })).not.toBeInTheDocument();
});

test("keeps both hint-area lines mounted across every stage -- only the hidden class ever changes", () => {
  const { rerender } = render(<ConjugationInput {...baseProps} randomVerb={baseVerb} />);
  const getLines = () => Array.from(document.querySelectorAll(".hint-text"));

  expect(getLines()).toHaveLength(2);
  expect(getLines().every((line) => line.classList.contains("hint-text--hidden"))).toBe(true);

  rerender(<ConjugationInput {...baseProps} randomVerb={baseVerb} showHint />);
  expect(getLines()).toHaveLength(2);
  const [answerAfterHint, hintAfterHint] = getLines();
  expect(answerAfterHint).toHaveClass("hint-text--hidden");
  expect(hintAfterHint).not.toHaveClass("hint-text--hidden");

  rerender(
    <ConjugationInput {...baseProps} randomVerb={baseVerb} showHint showAnswer />,
  );
  expect(getLines()).toHaveLength(2);
  const [answerAfterReveal, hintAfterReveal] = getLines();
  expect(answerAfterReveal).not.toHaveClass("hint-text--hidden");
  expect(hintAfterReveal).toHaveClass("hint-text--hidden");
});

test("shows a Next Verb button after a miss or once correct, which calls fetchRandomVerbConjugation", async () => {
  const user = userEvent.setup();
  const fetchRandomVerbConjugation = vi.fn();
  render(
    <ConjugationInput
      {...baseProps}
      randomVerb={baseVerb}
      isCorrectAnswer="true"
      fetchRandomVerbConjugation={fetchRandomVerbConjugation}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Next Verb" }));
  expect(fetchRandomVerbConjugation).toHaveBeenCalledTimes(1);
});

test("shows Check Answer and Show Hint (but no Next Verb, and no visible hint/answer text) before anything has happened", () => {
  render(<ConjugationInput {...baseProps} randomVerb={baseVerb} />);
  expect(screen.getByRole("button", { name: "Check Answer" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show Hint" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next Verb" })).not.toBeInTheDocument();
  // Both lines are always mounted (reserving their real height up front, so
  // revealing one never changes the card's height) but hidden until asked
  // for -- see ConjugationInput's hint-area comment.
  const [answerLine, hintLine] = document.querySelectorAll(".hint-text");
  expect(answerLine).toHaveClass("hint-text--hidden");
  expect(hintLine).toHaveClass("hint-text--hidden");
});

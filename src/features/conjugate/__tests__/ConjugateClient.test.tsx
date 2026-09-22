import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ConjugateClient from "../ConjugateClient";
import { fetchRandomVerbConjugation } from "../../../languages/api";
import type { LanguageDefinition } from "../../../languages/registry";
import type { Tense, TenseExample, VerbConjugation } from "../../../languages/types";

vi.mock("../../../languages/api");

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

const tenseExamples: Record<Tense, TenseExample> = {
  present: { target: "Yo hablo", english: "I speak" },
  preterite: { target: "Yo hablé", english: "I spoke" },
  imperfect: { target: "Yo hablaba", english: "I was speaking" },
  perfect: { target: "Yo he hablado", english: "I have spoken" },
  future: { target: "Yo hablaré", english: "I will speak" },
  future_perfect: { target: "Yo habré hablado", english: "I will have spoken" },
  conditional: { target: "Yo hablaría", english: "I would speak" },
  conditional_perfect: { target: "Yo habría hablado", english: "I would have spoken" },
  preterite_perfect: { target: "Yo hube hablado", english: "I had spoken" },
  pluperfect: { target: "Yo había hablado", english: "I had spoken" },
  imperative: { target: "¡Habla!", english: "Speak!" },
};

const definition: LanguageDefinition = {
  code: "es",
  displayName: "Spanish",
  flagEmoji: "flag",
  enabled: true,
  hasVerbs: true,
  hasWatch: true,
  verbCount: 10,
  wordCount: 10,
  tenseLabels,
  tenseExamples,
  availableTenses: ["present", "imperfect", "preterite", "imperative"],
  indicativeOnlyTenses: ["preterite"],
  hasSubjunctive: true,
  accentChars: ["á", "é"],
  extraToggles: [{ key: "useRegionalVariant", prompt: 'Do you want to include "vosotros"?' }],
  grammarTopics: [],
  upcomingGrammarTopics: [],
};

const presentVerb: VerbConjugation = {
  form_english: "I speak",
  form_target: "hablo",
  form_target_alt: "hablás",
  pronoun_english: "I",
  infinitive_target: "hablar",
  mood: "indicative",
  tense: "present",
};

const tuVerb: VerbConjugation = {
  form_english: "you speak",
  form_target: "hablas",
  pronoun_english: "you",
  infinitive_target: "hablar",
  mood: "indicative",
  tense: "present",
};

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  vi.mocked(fetchRandomVerbConjugation).mockReset();
  vi.mocked(fetchRandomVerbConjugation).mockResolvedValue(presentVerb);
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("setup wizard", () => {
  test("walks irregular -> toggle -> mood -> tense steps, then fetches the first question", async () => {
    const user = userEvent.setup();
    render(<ConjugateClient code="es" definition={definition} />);

    expect(document.querySelectorAll(".step-dot")).toHaveLength(4);
    expect(
      screen.getByRole("heading", { name: "Do you want irregular verbs?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(
      screen.getByRole("heading", { name: 'Do you want to include "vosotros"?' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "No" }));
    expect(
      screen.getByRole("heading", { name: "Which mood would you like to practice?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Indicative" }));
    expect(
      screen.getByRole("heading", { name: "Which tenses would you like to practice?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Present" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Present" }));
    await user.click(screen.getByRole("button", { name: "Let's go!" }));
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledWith(
      "es",
      true,
      false,
      "indicative",
      "present",
      "affirmative",
    );
    expect(screen.getByText("I speak")).toBeInTheDocument();
    expect(document.querySelector(".step-progress")).not.toBeInTheDocument();
  });

  test("the All tenses card toggles every tense at once", async () => {
    const user = userEvent.setup();
    render(<ConjugateClient code="es" definition={definition} />);

    await user.click(screen.getByRole("button", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    await user.click(screen.getByRole("button", { name: "Both" }));

    const allTenses = screen.getByRole("button", { name: "All tenses" });
    await user.click(allTenses);
    expect(allTenses).toHaveClass("selection-card--selected");

    await user.click(allTenses);
    expect(screen.getByRole("button", { name: "Let's go!" })).toBeDisabled();
  });
});

describe("skipping setup with initialTenses", () => {
  test("jumps straight to the first question with indicative mood and irregular verbs on", async () => {
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledWith(
      "es",
      true,
      false,
      "indicative",
      "present",
      "affirmative",
    );
    expect(screen.queryByRole("heading", { name: /irregular verbs/ })).not.toBeInTheDocument();
    expect(screen.getByText("I speak")).toBeInTheDocument();
  });
});

describe("answering questions", () => {
  const setupActiveQuestion = async () => {
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();
    return screen.getByPlaceholderText("Enter your translation") as HTMLInputElement;
  };

  const historyRows = () =>
    Array.from(document.querySelectorAll<HTMLElement>(".history-table tbody tr"));

  test("reserves the accent-toolbar row before any answer, rather than adding/removing it", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    // Stays mounted (reserving its row's height) from the first question --
    // flipping between "unanswered" and "resolved" should only toggle the
    // hidden class, not insert/remove the element, so nothing below the
    // card jumps.
    expect(document.querySelector(".accent-toolbar")).not.toHaveClass(
      "accent-toolbar--hidden",
    );
    expect(document.querySelector(".quiz-input-icon")).not.toBeInTheDocument();

    await user.type(input, "hablo");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(document.querySelector(".accent-toolbar")).toHaveClass("accent-toolbar--hidden");
    expect(document.querySelector(".quiz-input-icon")).toHaveClass("correct");
  });

  test("a correct guess shows an inline result icon, and logs a Correct row once the session is stopped", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "hablo");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(document.querySelector(".quiz-input-icon")).toHaveClass("correct");
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    // The history table only appears on the summary screen, not during
    // active practice (see "does not show the practice history table
    // during practice" below) -- this records the answer right away, but
    // it isn't visible until "Stop practice" is clicked.
    expect(document.querySelector(".history-table-wrap")).not.toBeInTheDocument();

    vi.mocked(fetchRandomVerbConjugation).mockResolvedValueOnce(tuVerb);
    await user.click(screen.getByRole("button", { name: "Next Verb" }));
    await flush();

    expect(screen.getByText("you speak")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Stop practice" }));
    expect(historyRows()).toHaveLength(1);
    const [row] = historyRows();
    expect(within(row).getByText("hablo")).toBeInTheDocument();
    expect(within(row).getByRole("img", { name: "Correct" })).toBeInTheDocument();
  });

  test("giving up logs an Incorrect row, visible once the session is stopped", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "nope");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));
    await user.click(screen.getByRole("button", { name: "Show Hint" }));
    await user.click(screen.getByRole("button", { name: "Show Answer" }));
    expect(document.querySelector(".history-table-wrap")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Stop practice" }));
    expect(historyRows()).toHaveLength(1);
    expect(
      within(historyRows()[0]).getByRole("img", { name: "Incorrect" }),
    ).toBeInTheDocument();
  });

  test("matches the alternate form of the answer too", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "hablás");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(document.querySelector(".quiz-input-icon")).toHaveClass("correct");
  });

  test("a wrong guess shows hint then answer, and typing again clears the result icon", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "nope");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));
    expect(document.querySelector(".quiz-input-icon")).toHaveClass("incorrect");

    await user.type(input, "x");
    // Unlike the always-mounted accent-toolbar, the result icon is
    // genuinely absent once the guess is unresolved again -- it's
    // absolutely positioned, so it never affects the card's layout either
    // way, mounted or not.
    expect(document.querySelector(".quiz-input-icon")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Hint" }));
    expect(screen.getByText("hablar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Answer" }));
    // Scoped to the question card, since giving up also logs this verb into
    // the history table below, which repeats some of the same text.
    const questionCard = document.querySelector(".question-card") as HTMLElement;
    expect(within(questionCard).getByText("hablo")).toBeInTheDocument();
    expect(within(questionCard).getByText("hablás")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check Answer" })).not.toBeInTheDocument();

    vi.mocked(fetchRandomVerbConjugation).mockResolvedValueOnce(tuVerb);
    await user.click(screen.getByRole("button", { name: "Next Verb" }));
    await flush();

    expect(screen.getByText("you speak")).toBeInTheDocument();
    // Show Hint is available again for the fresh question -- it isn't
    // gated behind having missed this new question too.
    expect(screen.getByRole("button", { name: "Show Hint" })).toBeInTheDocument();
  });

  test("submitting again once already correct fetches the next question", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "hablo");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));
    expect(fetchRandomVerbConjugation).toHaveBeenCalledTimes(1);

    vi.mocked(fetchRandomVerbConjugation).mockResolvedValueOnce(tuVerb);
    const form = input.closest("form") as HTMLFormElement;
    form.requestSubmit();
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledTimes(2);
    expect(screen.getByText("you speak")).toBeInTheDocument();
  });

  test("submitting again once the answer is already revealed does nothing", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "nope");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));
    await user.click(screen.getByRole("button", { name: "Show Hint" }));
    await user.click(screen.getByRole("button", { name: "Show Answer" }));
    expect(fetchRandomVerbConjugation).toHaveBeenCalledTimes(1);

    const form = input.closest("form") as HTMLFormElement;
    form.requestSubmit();
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledTimes(1);
  });
});

describe("mood and polarity resolution", () => {
  const walkToTenseStep = async (user: ReturnType<typeof userEvent.setup>, moodLabel: string) => {
    render(<ConjugateClient code="es" definition={definition} />);
    await user.click(screen.getByRole("button", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    await user.click(screen.getByRole("button", { name: moodLabel }));
  };

  test("a tense with no subjunctive form always resolves to indicative, regardless of mood choice", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    await walkToTenseStep(user, "Both");

    await user.click(screen.getByRole("button", { name: "Preterite" }));
    await user.click(screen.getByRole("button", { name: "Let's go!" }));
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledWith(
      "es",
      true,
      false,
      "indicative",
      "preterite",
      "affirmative",
    );
  });

  test("mood 'both' resolves to indicative when the coin flip is low", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.1);
    await walkToTenseStep(user, "Both");

    await user.click(screen.getByRole("button", { name: "Imperfect" }));
    await user.click(screen.getByRole("button", { name: "Let's go!" }));
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledWith(
      "es",
      true,
      false,
      "indicative",
      "imperfect",
      "affirmative",
    );
  });

  test("mood 'both' resolves to subjunctive when the coin flip is high", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    await walkToTenseStep(user, "Both");

    await user.click(screen.getByRole("button", { name: "Imperfect" }));
    await user.click(screen.getByRole("button", { name: "Let's go!" }));
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledWith(
      "es",
      true,
      false,
      "subjunctive",
      "imperfect",
      "affirmative",
    );
  });

  test("choosing subjunctive mood directly resolves to subjunctive", async () => {
    const user = userEvent.setup();
    await walkToTenseStep(user, "Subjunctive");

    await user.click(screen.getByRole("button", { name: "Imperfect" }));
    await user.click(screen.getByRole("button", { name: "Let's go!" }));
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledWith(
      "es",
      true,
      false,
      "subjunctive",
      "imperfect",
      "affirmative",
    );
  });

  test("the imperative resolves to indicative mood and picks a random polarity", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    await walkToTenseStep(user, "Both");

    await user.click(screen.getByRole("button", { name: "Imperative" }));
    await user.click(screen.getByRole("button", { name: "Let's go!" }));
    await flush();

    expect(fetchRandomVerbConjugation).toHaveBeenCalledWith(
      "es",
      true,
      false,
      "indicative",
      "imperative",
      "negative",
    );
  });
});

describe("daily goal bar", () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps the fake clock ticking alongside real time,
    // which is what stops `await user.click(...)` from hanging forever --
    // user-event's internals depend on real scheduling (e.g. MessageChannel)
    // that a plain vi.useFakeTimers() freezes along with everything else.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  test("defaults to a 15-minute daily goal", async () => {
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    expect(document.querySelector(".goal-bar-label")?.textContent).toBe("0:00 / 15:00");
  });

  test("changing the goal updates the target and persists it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Change today's conjugate goal" }));
    const input = screen.getByLabelText("goal in minutes");
    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.blur(input);

    expect(document.querySelector(".goal-bar-label")?.textContent).toBe("0:00 / 20:00");
    expect(window.localStorage.getItem("dialectrek-conjugate-goal-seconds")).toBe("1200");
  });

  test("keeps conjugating uninterrupted past the goal, unlike a session timer", async () => {
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15 * 60_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    // No stop screen -- the bar just reports the goal reached and
    // conjugating continues exactly as before.
    expect(screen.queryByRole("heading", { name: /Time's up/ })).not.toBeInTheDocument();
    expect(document.querySelector(".goal-bar-label")?.textContent).toMatch(/^Goal reached!/);
    expect(screen.getByPlaceholderText("Enter your translation")).toBeInTheDocument();
  });
});

describe("full-screen practice mode", () => {
  test("hides the site header/footer for as long as practice is active, and restores them on stop", async () => {
    const user = userEvent.setup();
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    expect(document.body).toHaveClass("focus-mode-open");

    await user.click(screen.getByRole("button", { name: "Stop practice" }));
    expect(document.body).not.toHaveClass("focus-mode-open");
  });
});

describe("session summary", () => {
  test("does not show the practice history table until the session is stopped", async () => {
    const user = userEvent.setup();
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    const input = screen.getByPlaceholderText("Enter your translation");
    await user.type(input, "hablo");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(document.querySelector(".history-table-wrap")).not.toBeInTheDocument();
  });

  test("summary subtitle reports the score as a fraction and percentage", async () => {
    const user = userEvent.setup();
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    const input = screen.getByPlaceholderText("Enter your translation");
    await user.type(input, "hablo");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));

    vi.mocked(fetchRandomVerbConjugation).mockResolvedValueOnce(tuVerb);
    await user.click(screen.getByRole("button", { name: "Next Verb" }));
    await flush();

    await user.type(screen.getByPlaceholderText("Enter your translation"), "nope");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));
    await user.click(screen.getByRole("button", { name: "Show Hint" }));
    await user.click(screen.getByRole("button", { name: "Show Answer" }));

    await user.click(screen.getByRole("button", { name: "Stop practice" }));

    expect(screen.getByText("Session summary")).toBeInTheDocument();
    expect(screen.getByText("You got 1 right out of 2 (50%).")).toBeInTheDocument();
  });

  test("practicing again returns to the start of the setup wizard with a clean slate", async () => {
    const user = userEvent.setup();
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    const input = screen.getByPlaceholderText("Enter your translation");
    await user.type(input, "hablo");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));
    await user.click(screen.getByRole("button", { name: "Stop practice" }));

    await user.click(screen.getByRole("button", { name: "Practice again" }));

    expect(
      screen.getByRole("heading", { name: "Do you want irregular verbs?" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".goal-bar-label")).not.toBeInTheDocument();
  });
});

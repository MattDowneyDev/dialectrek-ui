import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ConjugateClient from "../ConjugateClient";
import { fetchRandomVerbConjugation } from "../../../languages/api";
import type { LanguageDefinition } from "../../../languages/registry";
import type { Tense, VerbConjugation } from "../../../languages/types";

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
    await user.click(screen.getByRole("button", { name: "Let's conjugate!" }));
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

  test("select all / deselect all toggles every tense at once", async () => {
    const user = userEvent.setup();
    render(<ConjugateClient code="es" definition={definition} />);

    await user.click(screen.getByRole("button", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    await user.click(screen.getByRole("button", { name: "Both" }));

    const selectAll = screen.getByRole("button", { name: "Select all" });
    await user.click(selectAll);
    expect(screen.getByRole("button", { name: "Deselect all" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Deselect all" }));
    expect(screen.getByRole("button", { name: "Let's conjugate!" })).toBeDisabled();
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

  test("a correct guess shows the correct banner and bumps the score", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "hablo");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(screen.getByText("✓ Correct!")).toBeInTheDocument();
    expect(document.querySelector(".stat-card--score")?.textContent).toContain("1");

    vi.mocked(fetchRandomVerbConjugation).mockResolvedValueOnce(tuVerb);
    await user.click(screen.getByRole("button", { name: "Next Verb" }));
    await flush();

    expect(screen.getByText("you speak")).toBeInTheDocument();
    expect(document.querySelector(".stat-card--score")?.textContent).toContain("1/1");
  });

  test("matches the alternate form of the answer too", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "hablás");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(screen.getByText("✓ Correct!")).toBeInTheDocument();
  });

  test("a wrong guess shows hint then answer, and typing again clears the incorrect banner", async () => {
    const user = userEvent.setup();
    const input = await setupActiveQuestion();

    await user.type(input, "nope");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));
    expect(screen.getByText("✗ Incorrect")).toBeInTheDocument();

    await user.type(input, "x");
    expect(screen.queryByText("✗ Incorrect")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Hint" }));
    expect(screen.getByText("hablar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Answer" }));
    expect(screen.getByText("hablo")).toBeInTheDocument();
    expect(screen.getByText("hablás")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check Answer" })).not.toBeInTheDocument();

    vi.mocked(fetchRandomVerbConjugation).mockResolvedValueOnce(tuVerb);
    await user.click(screen.getByRole("button", { name: "Next Verb" }));
    await flush();

    expect(screen.getByText("you speak")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show Hint" })).not.toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Let's conjugate!" }));
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
    await user.click(screen.getByRole("button", { name: "Let's conjugate!" }));
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
    await user.click(screen.getByRole("button", { name: "Let's conjugate!" }));
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
    await user.click(screen.getByRole("button", { name: "Let's conjugate!" }));
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
    await user.click(screen.getByRole("button", { name: "Let's conjugate!" }));
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

describe("timer / time-up flow", () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps the fake clock ticking alongside real time,
    // which is what stops `await user.click(...)` from hanging forever --
    // user-event's internals depend on real scheduling (e.g. MessageChannel)
    // that a plain vi.useFakeTimers() freezes along with everything else.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  test("choosing 'No limit' switches the timer to counting up", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Set timer" }));
    await user.click(screen.getByRole("button", { name: "No limit" }));

    expect(screen.queryByRole("button", { name: "Set timer" })).not.toBeInTheDocument();
    expect(screen.getByText("time")).toBeInTheDocument();
  });

  test("reaches a chosen time limit, shows the summary, and Conjugate Again resets the session", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Set timer" }));
    await user.click(screen.getByRole("button", { name: "1 min" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(screen.getByRole("heading", { name: /Time's up/ })).toBeInTheDocument();
    expect(screen.getByText("No questions answered yet")).toBeInTheDocument();

    vi.mocked(fetchRandomVerbConjugation).mockResolvedValueOnce(presentVerb);
    await user.click(screen.getByRole("button", { name: "Conjugate Again" }));
    await flush();

    expect(screen.getByRole("button", { name: "Set timer" })).toBeInTheDocument();
    expect(screen.getByText("I speak")).toBeInTheDocument();
  });

  test("shows a percentage summary when questions were answered before time ran out", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ConjugateClient code="es" definition={definition} initialTenses={["present"]} />);
    await flush();

    const input = screen.getByPlaceholderText("Enter your translation");
    await user.type(input, "hablo");
    await user.click(screen.getByRole("button", { name: "Check Answer" }));
    vi.mocked(fetchRandomVerbConjugation).mockResolvedValueOnce(tuVerb);
    await user.click(screen.getByRole("button", { name: "Next Verb" }));
    await flush();

    await user.click(screen.getByRole("button", { name: "Set timer" }));
    await user.click(screen.getByRole("button", { name: "1 min" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(screen.getByText("100% correct")).toBeInTheDocument();
  });
});

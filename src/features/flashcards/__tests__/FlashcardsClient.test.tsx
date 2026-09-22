import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import FlashcardsClient from "../FlashcardsClient";
import { fetchRandomWord, fetchWordCategories } from "../../../languages/api";
import type { LanguageDefinition } from "../../../languages/registry";

vi.mock("../../../languages/api");

const definition: LanguageDefinition = {
  code: "es",
  displayName: "Spanish",
  flagEmoji: "flag",
  enabled: true,
  hasVerbs: true,
  hasWatch: true,
  verbCount: 10,
  wordCount: 500,
  tenseLabels: {} as LanguageDefinition["tenseLabels"],
  tenseExamples: {} as LanguageDefinition["tenseExamples"],
  availableTenses: [],
  indicativeOnlyTenses: [],
  hasSubjunctive: false,
  accentChars: [],
  extraToggles: [],
  grammarTopics: [],
  upcomingGrammarTopics: [],
};

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

// Picks "All words" and confirms -- the setup screen's default path into
// practice mode, used by most tests below that don't care which specific
// categories ended up selected.
const chooseAllWordsAndGo = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "All words" }));
  await user.click(screen.getByRole("button", { name: "Let's go!" }));
};

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(fetchWordCategories).mockResolvedValue(["greetings"]);
  vi.mocked(fetchRandomWord).mockResolvedValue({
    rank: 1,
    word_target: "hola",
    word_english: "hello",
    category: "greetings",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("category screen", () => {
  test("shows only the title, subtitle, and category cards -- no progress meter yet", async () => {
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();

    expect(screen.getByText("Flashcards")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All words" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Greetings" })).toBeInTheDocument();
    expect(document.querySelector(".goal-bar-label")).not.toBeInTheDocument();
  });

  test("multiple categories can be selected before confirming", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchWordCategories).mockResolvedValue(["greetings", "food"]);
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();

    const letsGo = screen.getByRole("button", { name: "Let's go!" });
    expect(letsGo).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Greetings" }));
    await user.click(screen.getByRole("button", { name: "Food" }));
    expect(screen.getByRole("button", { name: "Greetings" })).toHaveClass(
      "selection-card--selected",
    );
    expect(screen.getByRole("button", { name: "Food" })).toHaveClass(
      "selection-card--selected",
    );
    expect(letsGo).toBeEnabled();

    await user.click(letsGo);
    await flush();
    expect(screen.getByLabelText("Flip flashcard")).toBeInTheDocument();
  });
});

describe("full-screen practice mode", () => {
  test("hides the site header/footer for as long as practice is active, and restores them on stop", async () => {
    const user = userEvent.setup();
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();

    expect(document.body).not.toHaveClass("focus-mode-open");

    await chooseAllWordsAndGo(user);
    await flush();
    expect(document.body).toHaveClass("focus-mode-open");

    await user.click(screen.getByRole("button", { name: "Stop practice" }));
    expect(document.body).not.toHaveClass("focus-mode-open");
  });

  test("removes the focus-mode class if the component unmounts mid-practice", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<FlashcardsClient code="es" definition={definition} />);
    await flush();
    await chooseAllWordsAndGo(user);
    await flush();
    expect(document.body).toHaveClass("focus-mode-open");

    unmount();
    expect(document.body).not.toHaveClass("focus-mode-open");
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

  test("defaults to a 15-minute daily goal once practice starts", async () => {
    const user = userEvent.setup({ delay: null });
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();

    await chooseAllWordsAndGo(user);
    await flush();

    expect(document.querySelector(".goal-bar-label")?.textContent).toBe("0:00 / 15:00");
  });

  test("changing the goal updates the target and persists it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();

    await chooseAllWordsAndGo(user);
    await flush();

    await user.click(screen.getByRole("button", { name: "Change today's flashcards goal" }));
    const input = screen.getByLabelText("goal in minutes");
    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.blur(input);

    expect(document.querySelector(".goal-bar-label")?.textContent).toBe("0:00 / 20:00");
    expect(window.localStorage.getItem("dialectrek-flashcards-goal-seconds")).toBe("1200");
  });

  test("keeps flashcards interactive past the goal instead of stopping", async () => {
    const user = userEvent.setup({ delay: null });
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();

    // Leaves the category-setup step, which starts the practice screen and
    // the daily-goal ticker.
    await chooseAllWordsAndGo(user);
    await flush();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15 * 60_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(screen.queryByText(/^Time's up/)).not.toBeInTheDocument();
    expect(document.querySelector(".goal-bar-label")?.textContent).toMatch(/^Goal reached!/);
  });
});

describe("layout stability", () => {
  test("reserves the 'I knew it' / 'I didn't know it' row's height even before the card is flipped", async () => {
    const user = userEvent.setup();
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();
    await chooseAllWordsAndGo(user);
    await flush();

    // Mounted (and reserving its row's height) from the start, just
    // visually hidden until the card is flipped -- flipping shouldn't add
    // or remove this element, only toggle the class that hides it, so
    // nothing below it in the page jumps.
    const controls = document.querySelector(".flashcards-controls");
    expect(controls).toBeInTheDocument();
    expect(controls).toHaveClass("flashcards-controls--hidden");

    await user.click(screen.getByLabelText("Flip flashcard"));
    expect(controls).toBeInTheDocument();
    expect(controls).not.toHaveClass("flashcards-controls--hidden");
  });
});

describe("session summary", () => {
  const startPractice = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();
    await chooseAllWordsAndGo(user);
    await flush();
  };

  test("does not show the practice history table during practice", async () => {
    const user = userEvent.setup();
    await startPractice(user);
    await user.click(screen.getByLabelText("Flip flashcard"));
    await user.click(screen.getByRole("button", { name: "I knew it" }));
    await flush();

    expect(document.querySelector(".history-table-wrap")).not.toBeInTheDocument();
  });

  test("stopping shows a summary of the words covered this session", async () => {
    const user = userEvent.setup();
    await startPractice(user);
    await user.click(screen.getByLabelText("Flip flashcard"));

    vi.mocked(fetchRandomWord).mockResolvedValueOnce({
      rank: 2,
      word_target: "adiós",
      word_english: "goodbye",
      category: "greetings",
    });
    await user.click(screen.getByRole("button", { name: "I knew it" }));
    await flush();

    await user.click(screen.getByRole("button", { name: "Stop practice" }));

    expect(screen.getByText("Session summary")).toBeInTheDocument();
    const rows = document.querySelectorAll(".history-table tbody tr");
    expect(rows).toHaveLength(1);
    expect(within(rows[0] as HTMLElement).getByText("hola")).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByText("hello")).toBeInTheDocument();
    expect(
      within(rows[0] as HTMLElement).getByRole("img", { name: "Correct" }),
    ).toBeInTheDocument();
  });

  test("logs an Incorrect row for a word answered wrong", async () => {
    const user = userEvent.setup();
    await startPractice(user);
    await user.click(screen.getByLabelText("Flip flashcard"));

    vi.mocked(fetchRandomWord).mockResolvedValueOnce({
      rank: 2,
      word_target: "adiós",
      word_english: "goodbye",
      category: "greetings",
    });
    await user.click(screen.getByRole("button", { name: "I didn't know it" }));
    await flush();

    await user.click(screen.getByRole("button", { name: "Stop practice" }));

    const rows = document.querySelectorAll(".history-table tbody tr");
    expect(rows).toHaveLength(1);
    expect(
      within(rows[0] as HTMLElement).getByRole("img", { name: "Incorrect" }),
    ).toBeInTheDocument();
  });

  test("summary subtitle reports the score as a fraction and percentage", async () => {
    const user = userEvent.setup();
    await startPractice(user);
    await user.click(screen.getByLabelText("Flip flashcard"));

    vi.mocked(fetchRandomWord).mockResolvedValueOnce({
      rank: 2,
      word_target: "adiós",
      word_english: "goodbye",
      category: "greetings",
    });
    await user.click(screen.getByRole("button", { name: "I knew it" }));
    await flush();
    await user.click(screen.getByLabelText("Flip flashcard"));

    vi.mocked(fetchRandomWord).mockResolvedValueOnce({
      rank: 3,
      word_target: "gracias",
      word_english: "thank you",
      category: "greetings",
    });
    await user.click(screen.getByRole("button", { name: "I didn't know it" }));
    await flush();

    await user.click(screen.getByRole("button", { name: "Stop practice" }));

    expect(screen.getByText("You got 1 right out of 2 (50%).")).toBeInTheDocument();
  });

  test("choosing different categories from the summary returns to the category screen with a clean slate", async () => {
    const user = userEvent.setup();
    await startPractice(user);
    await user.click(screen.getByLabelText("Flip flashcard"));
    await user.click(screen.getByRole("button", { name: "I knew it" }));
    await flush();
    await user.click(screen.getByRole("button", { name: "Stop practice" }));

    await user.click(screen.getByRole("button", { name: "Choose different categories" }));

    const allWords = screen.getByRole("button", { name: "All words" });
    expect(allWords).toBeInTheDocument();
    expect(allWords).not.toHaveClass("selection-card--selected");

    // Starting a fresh session shouldn't carry over the previous one's
    // history into its summary.
    await chooseAllWordsAndGo(user);
    await flush();
    await user.click(screen.getByRole("button", { name: "Stop practice" }));
    expect(document.querySelector(".history-table-wrap")).not.toBeInTheDocument();
  });
});

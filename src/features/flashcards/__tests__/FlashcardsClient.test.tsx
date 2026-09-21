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

describe("daily goal bar", () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps the fake clock ticking alongside real time,
    // which is what stops `await user.click(...)` from hanging forever --
    // user-event's internals depend on real scheduling (e.g. MessageChannel)
    // that a plain vi.useFakeTimers() freezes along with everything else.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  test("defaults to a 15-minute daily goal", async () => {
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();

    expect(document.querySelector(".goal-bar-label")?.textContent).toBe("0:00 / 15:00");
  });

  test("changing the goal updates the target and persists it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<FlashcardsClient code="es" definition={definition} />);
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
    await user.click(screen.getByRole("button", { name: "All words" }));
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
    await user.click(screen.getByRole("button", { name: "All words" }));
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

describe("practice history table", () => {
  const startPractice = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<FlashcardsClient code="es" definition={definition} />);
    await flush();
    await user.click(screen.getByRole("button", { name: "All words" }));
    await flush();
    await user.click(screen.getByLabelText("Flip flashcard"));
  };

  test("does not show a table until a word has been answered", async () => {
    const user = userEvent.setup();
    await startPractice(user);

    expect(document.querySelector(".history-table-wrap")).not.toBeInTheDocument();
  });

  test("logs a Correct row when 'I knew it' is clicked", async () => {
    const user = userEvent.setup();
    await startPractice(user);

    vi.mocked(fetchRandomWord).mockResolvedValueOnce({
      rank: 2,
      word_target: "adiós",
      word_english: "goodbye",
      category: "greetings",
    });
    await user.click(screen.getByRole("button", { name: "I knew it" }));
    await flush();

    const rows = document.querySelectorAll(".history-table tbody tr");
    expect(rows).toHaveLength(1);
    expect(within(rows[0] as HTMLElement).getByText("hola")).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByText("hello")).toBeInTheDocument();
    expect(
      within(rows[0] as HTMLElement).getByRole("img", { name: "Correct" }),
    ).toBeInTheDocument();
  });

  test("logs an Incorrect row when 'I didn't know it' is clicked", async () => {
    const user = userEvent.setup();
    await startPractice(user);

    vi.mocked(fetchRandomWord).mockResolvedValueOnce({
      rank: 2,
      word_target: "adiós",
      word_english: "goodbye",
      category: "greetings",
    });
    await user.click(screen.getByRole("button", { name: "I didn't know it" }));
    await flush();

    const rows = document.querySelectorAll(".history-table tbody tr");
    expect(rows).toHaveLength(1);
    expect(
      within(rows[0] as HTMLElement).getByRole("img", { name: "Incorrect" }),
    ).toBeInTheDocument();
  });
});

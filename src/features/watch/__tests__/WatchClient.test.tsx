import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSearchParams } from "next/navigation";
import WatchClient from "../WatchClient";
import { compareVideos, dislikeVideo, fetchRelatedVideos, fetchVideos, likeVideo } from "../api";
import {
  getSessionId,
  persistDailyWatchSeconds,
  persistDislikedIds,
  persistLikedIds,
  persistWatchGoalSeconds,
  readDailyWatchSeconds,
  readDislikedIds,
  readLikedIds,
  readWatchGoalSeconds,
} from "../session";
import type { LanguageDefinition } from "../../../languages/registry";
import type { Video } from "../types";

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/es/watch"),
  useRouter: vi.fn(() => ({ push: mockPush, replace: mockReplace })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("../api");
vi.mock("../session");

let latestPlayerStateChange: ((state: number) => void) | null = null;

vi.mock("../YouTubePlayer", () => ({
  default: ({
    videoId,
    onPlayerStateChange,
  }: {
    videoId: string;
    onPlayerStateChange?: (state: number) => void;
  }) => {
    latestPlayerStateChange = onPlayerStateChange ?? null;
    return <div data-testid="youtube-player">{videoId}</div>;
  },
}));

vi.mock("../WatchIntroModal", () => ({ default: () => null }));

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;
let ioCallback: IOCallback | null = null;

class FakeIntersectionObserver {
  constructor(cb: IOCallback) {
    ioCallback = cb;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const definition: LanguageDefinition = {
  code: "es",
  displayName: "Spanish",
  flagEmoji: "es",
  enabled: true,
  hasVerbs: true,
  hasWatch: true,
  verbCount: 1,
  wordCount: 1,
  tenseLabels: {} as LanguageDefinition["tenseLabels"],
  availableTenses: [],
  indicativeOnlyTenses: [],
  hasSubjunctive: false,
  accentChars: [],
  extraToggles: [],
  grammarTopics: [],
  upcomingGrammarTopics: [],
};

const makeVideo = (overrides: Partial<Video> = {}): Video => ({
  id: "v1",
  youtubeId: "yt1",
  title: "Video One",
  channel: "Channel One",
  durationSeconds: 125,
  difficultyScore: 900,
  likeCount: 2,
  ...overrides,
});

const setSearchParams = (query: string) => {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(query) as unknown as ReturnType<typeof useSearchParams>,
  );
};

const triggerIntersection = () => {
  act(() => {
    ioCallback?.([{ isIntersecting: true }]);
  });
};

beforeEach(() => {
  ioCallback = null;
  latestPlayerStateChange = null;
  window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  setSearchParams("");
  vi.mocked(fetchVideos).mockResolvedValue({ items: [], hasMore: false });
  vi.mocked(fetchRelatedVideos).mockResolvedValue([]);
  vi.mocked(getSessionId).mockReturnValue("session-1");
  vi.mocked(readLikedIds).mockReturnValue(new Set());
  vi.mocked(readDislikedIds).mockReturnValue(new Set());
  vi.mocked(readWatchGoalSeconds).mockReturnValue(600);
  vi.mocked(readDailyWatchSeconds).mockReturnValue(0);
  vi.mocked(likeVideo).mockResolvedValue(undefined);
  vi.mocked(dislikeVideo).mockResolvedValue(undefined);
  vi.mocked(compareVideos).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("initial data", () => {
  test("fetches videos on mount when no initial data is provided", async () => {
    vi.mocked(fetchVideos).mockResolvedValue({ items: [makeVideo()], hasMore: false });
    render(<WatchClient code="es" definition={definition} />);
    expect(screen.getByText("Loading videos...")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Video One")).toBeInTheDocument());
    expect(fetchVideos).toHaveBeenCalledWith("es", { level: undefined, sort: "random", seed: expect.any(Number) });
  });

  test("does not refetch when initial data already matches the current filters", async () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(screen.getByText("Video One")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchVideos).not.toHaveBeenCalled();
  });

  test("merges the initial active video into the list when it's not already there", async () => {
    setSearchParams("video=v2");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialActiveVideo={makeVideo({ id: "v2", title: "Video Two" })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Video Two" })).toBeInTheDocument();
    await act(async () => {});
  });

  test("does not duplicate the initial active video when it's already in the initial list", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialActiveVideo={makeVideo({ id: "v1" })}
      />,
    );
    expect(screen.getAllByRole("button", { name: /Video One/ })).toHaveLength(1);
  });

  test("shows an empty state when there are no videos at all", () => {
    render(
      <WatchClient code="es" definition={definition} initialVideos={[]} initialHasMore={false} initialSeed={1} />,
    );
    expect(screen.getByText("No videos at this level yet. Try a different filter.")).toBeInTheDocument();
  });
});

describe("filters", () => {
  test("changing the level filter replaces the URL and refetches", async () => {
    // Each render/rerender below builds its own fresh JSX element (rather
    // than reusing one stored in a variable) -- reusing the same element
    // object would give WatchClient a referentially identical props object
    // on the second pass, which lets React bail out of calling the
    // component body again entirely, so useSearchParams() would never
    // rerun and the test would silently observe no update at all.
    const renderWatchClient = () => (
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />
    );
    const { rerender } = render(renderWatchClient());

    fireEvent.change(screen.getByLabelText("Filter by level"), { target: { value: "b1" } });
    expect(mockReplace).toHaveBeenCalledWith("/es/watch?level=b1");

    vi.mocked(fetchVideos).mockResolvedValue({ items: [makeVideo({ id: "v2", title: "B1 Video" })], hasMore: false });
    setSearchParams("level=b1");
    rerender(renderWatchClient());
    await waitFor(() =>
      expect(fetchVideos).toHaveBeenCalledWith("es", { level: "b1", sort: "random", seed: expect.any(Number) }),
    );
    await waitFor(() => expect(screen.getByText("B1 Video")).toBeInTheDocument());
  });

  test("resetting the level filter back to 'all' clears the query param", () => {
    setSearchParams("level=b1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    fireEvent.change(screen.getByLabelText("Filter by level"), { target: { value: "all" } });
    expect(mockReplace).toHaveBeenCalledWith("/es/watch");
  });

  test("changing the sort mode replaces the URL", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    fireEvent.change(screen.getByLabelText("Sort videos"), { target: { value: "most-liked" } });
    expect(mockReplace).toHaveBeenCalledWith("/es/watch?sort=most-liked");
  });

  test("resetting sort back to random clears the query param", () => {
    setSearchParams("sort=easiest");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    fireEvent.change(screen.getByLabelText("Sort videos"), { target: { value: "random" } });
    expect(mockReplace).toHaveBeenCalledWith("/es/watch");
  });

  test("an invalid level or sort value in the URL falls back to defaults", () => {
    setSearchParams("level=bogus&sort=bogus");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(screen.getByLabelText("Filter by level")).toHaveValue("all");
    expect(screen.getByLabelText("Sort videos")).toHaveValue("random");
  });
});

describe("load more", () => {
  test("loads the next page when the sentinel intersects and appends results", async () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", title: "Video One" })]}
        initialHasMore={true}
        initialSeed={1}
      />,
    );
    vi.mocked(fetchVideos).mockResolvedValue({
      items: [makeVideo({ id: "v2", title: "Video Two" })],
      hasMore: false,
    });

    triggerIntersection();
    expect(screen.getByText("Loading more...")).toBeInTheDocument();
    expect(fetchVideos).toHaveBeenCalledWith("es", {
      level: undefined,
      sort: "random",
      seed: 1,
      offset: 1,
    });

    await waitFor(() => expect(screen.getByText("Video Two")).toBeInTheDocument());
    expect(screen.queryByText("Loading more...")).not.toBeInTheDocument();
  });

  test("does not load more once hasMore is false", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    triggerIntersection();
    expect(fetchVideos).not.toHaveBeenCalled();
  });
});

describe("opening and leaving a video", () => {
  test("clicking a video card pushes the video id into the URL", async () => {
    const user = userEvent.setup();
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Video One/ }));
    expect(mockPush).toHaveBeenCalledWith("/es/watch?video=v1");
  });

  test("renders the player, badge, and vote buttons for the active video", async () => {
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", title: "Video One", durationSeconds: 65 })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(screen.getByRole("heading", { name: "Video One" })).toBeInTheDocument();
    expect(screen.getByText(/Channel One · 1:05/)).toBeInTheDocument();
    expect(screen.getByTestId("youtube-player")).toHaveTextContent("yt1");
    expect(screen.getByRole("button", { name: /2/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Dislike")).toBeInTheDocument();
    // Flushes the related-videos fetch this video triggers, so its mocked
    // promise resolves inside act() instead of after the test returns.
    await act(async () => {});
  });

  test("renders the placeholder icon instead of the player for a placeholder video", async () => {
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", youtubeId: "placeholder-1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(screen.queryByTestId("youtube-player")).not.toBeInTheDocument();
    expect(document.querySelector(".watch-player-frame svg")).toBeInTheDocument();
    await act(async () => {});
  });

  test("the back link returns to the browse grid", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await user.click(screen.getByRole("button", { name: "← All videos" }));
    expect(mockPush).toHaveBeenCalledWith("/es/watch");
  });

  test("shows a prompt instead of compare thumbs for the first video of a session", async () => {
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(screen.getByText("Watch at least one more video to start ranking.")).toBeInTheDocument();
    await act(async () => {});
  });
});

describe("more from this creator", () => {
  test("fetches and renders other videos from the same channel", async () => {
    vi.mocked(fetchRelatedVideos).mockResolvedValue([
      makeVideo({ id: "v2", title: "Second Video", channel: "Channel One" }),
    ]);
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", channel: "Channel One" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(fetchRelatedVideos).toHaveBeenCalledWith("es", "v1");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "More from Channel One" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Second Video" })).toBeInTheDocument();
  });

  test("shows nothing when the channel has no other videos", async () => {
    vi.mocked(fetchRelatedVideos).mockResolvedValue([]);
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", channel: "Channel One" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await act(async () => {});
    expect(screen.queryByText(/More from/)).not.toBeInTheDocument();
  });

  test("selecting a related video opens it as the active video", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchRelatedVideos).mockResolvedValue([
      makeVideo({ id: "v2", title: "Second Video", channel: "Channel One" }),
    ]);
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", channel: "Channel One" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Second Video" })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("heading", { name: "Second Video" }));
    expect(mockPush).toHaveBeenCalledWith("/es/watch?video=v2");
  });

  test("refetches when a different video becomes active", async () => {
    setSearchParams("video=v1");
    const { rerender } = render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[
          makeVideo({ id: "v1", channel: "Channel One" }),
          makeVideo({ id: "v2", channel: "Channel Two" }),
        ]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await waitFor(() => expect(fetchRelatedVideos).toHaveBeenCalledWith("es", "v1"));

    setSearchParams("video=v2");
    rerender(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[
          makeVideo({ id: "v1", channel: "Channel One" }),
          makeVideo({ id: "v2", channel: "Channel Two" }),
        ]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await waitFor(() => expect(fetchRelatedVideos).toHaveBeenCalledWith("es", "v2"));
  });
});

describe("watch goal bar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const goalLabel = () => document.querySelector(".goal-bar-label")?.textContent;

  test("shows 0:00 / 10:00 on the browse grid before any video is opened", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(goalLabel()).toBe("0:00 / 10:00");
  });

  test("counts up only while the player reports PLAYING", async () => {
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    act(() => latestPlayerStateChange?.(1)); // YT.PlayerState.PLAYING
    act(() => vi.advanceTimersByTime(3000));
    expect(goalLabel()).toBe("0:03 / 10:00");

    act(() => latestPlayerStateChange?.(2)); // YT.PlayerState.PAUSED
    act(() => vi.advanceTimersByTime(3000));
    expect(goalLabel()).toBe("0:03 / 10:00");
    await act(async () => {});
  });

  test("keeps accumulating across a switch to a different video", async () => {
    setSearchParams("video=v1");
    const { rerender } = render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" }), makeVideo({ id: "v2" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    act(() => latestPlayerStateChange?.(1));
    act(() => vi.advanceTimersByTime(5000));
    expect(goalLabel()).toBe("0:05 / 10:00");

    setSearchParams("video=v2");
    rerender(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" }), makeVideo({ id: "v2" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    // Still 0:05 -- a fresh video hasn't reported PLAYING yet, so the switch
    // itself doesn't add time, but the total from before isn't lost either.
    expect(goalLabel()).toBe("0:05 / 10:00");

    act(() => latestPlayerStateChange?.(1));
    act(() => vi.advanceTimersByTime(2000));
    expect(goalLabel()).toBe("0:07 / 10:00");
    // Flushes the related-videos fetch this video switch kicked off, so its
    // mocked promise resolves inside act() instead of after the test returns.
    await act(async () => {});
  });

  test("shows a goal-reached message once the target is hit", async () => {
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    act(() => latestPlayerStateChange?.(1));
    act(() => vi.advanceTimersByTime(600_000)); // the full 10-minute goal
    expect(goalLabel()).toBe("Goal reached! 10:00");
    expect(document.querySelector(".goal-bar-fill--complete")).toBeInTheDocument();
    await act(async () => {});
  });

  test("starts from today's already-stored progress instead of 0", () => {
    vi.mocked(readDailyWatchSeconds).mockReturnValue(120);
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(goalLabel()).toBe("2:00 / 10:00");
  });

  test("does not clobber today's stored progress with 0 on mount", () => {
    // Regression test: watchedSeconds starts at 0 and the read-from-storage
    // effect only *schedules* the real value rather than applying it
    // immediately, so a naive "persist on every change" effect would fire
    // once on mount with the still-stale 0 and briefly overwrite today's
    // real total -- observable as progress resetting whenever this
    // component remounts (e.g. navigating to another tab and back).
    vi.mocked(readDailyWatchSeconds).mockReturnValue(120);
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(persistDailyWatchSeconds).not.toHaveBeenCalledWith(0);
  });

  test("persists progress to localStorage as it ticks", async () => {
    setSearchParams("video=v1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    act(() => latestPlayerStateChange?.(1));
    act(() => vi.advanceTimersByTime(4000));
    expect(persistDailyWatchSeconds).toHaveBeenLastCalledWith(4);
    await act(async () => {});
  });

  test("clicking the bar opens a goal stepper seeded with the current goal", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change today's watch goal" }));
    expect(screen.getByLabelText("goal in minutes")).toHaveValue(10);
  });

  test("the +/- buttons adjust and persist the goal by 5 minutes, without closing", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change today's watch goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase goal by 5 minutes" }));

    expect(goalLabel()).toBe("0:00 / 15:00");
    expect(persistWatchGoalSeconds).toHaveBeenCalledWith(900);
    expect(screen.getByLabelText("goal in minutes")).toHaveValue(15);

    fireEvent.click(screen.getByRole("button", { name: "Decrease goal by 5 minutes" }));
    fireEvent.click(screen.getByRole("button", { name: "Decrease goal by 5 minutes" }));
    expect(goalLabel()).toBe("0:00 / 5:00");
    expect(persistWatchGoalSeconds).toHaveBeenLastCalledWith(300);
  });

  test("the stepper won't go below 5 minutes", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change today's watch goal" }));
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Decrease goal by 5 minutes" }));
    }
    expect(goalLabel()).toBe("0:00 / 5:00");
  });

  test("typing a custom value and blurring commits and persists it", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change today's watch goal" }));
    fireEvent.change(screen.getByLabelText("goal in minutes"), { target: { value: "45" } });
    fireEvent.blur(screen.getByLabelText("goal in minutes"));

    expect(goalLabel()).toBe("0:00 / 45:00");
    expect(persistWatchGoalSeconds).toHaveBeenCalledWith(2700);
  });

  test("submitting the input (Enter) commits the same way as blurring", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change today's watch goal" }));
    fireEvent.change(screen.getByLabelText("goal in minutes"), { target: { value: "20" } });
    fireEvent.submit(screen.getByLabelText("goal in minutes").closest("form") as HTMLFormElement);

    expect(goalLabel()).toBe("0:00 / 20:00");
    expect(persistWatchGoalSeconds).toHaveBeenCalledWith(1200);
  });

  test("clearing the input and blurring reverts to the current goal instead of applying nothing", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change today's watch goal" }));
    fireEvent.change(screen.getByLabelText("goal in minutes"), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText("goal in minutes"));

    expect(persistWatchGoalSeconds).not.toHaveBeenCalled();
    expect(screen.getByLabelText("goal in minutes")).toHaveValue(10);
    expect(goalLabel()).toBe("0:00 / 10:00");
  });

  test("clicking outside the dropdown closes it without changing the goal", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo()]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change today's watch goal" }));
    expect(screen.getByLabelText("goal in minutes")).toBeInTheDocument();

    // The backdrop is what actually receives a real click outside the
    // dropdown -- jsdom doesn't hit-test by visual stacking the way a real
    // browser would, so the test has to target it directly.
    fireEvent.click(document.querySelector(".timer-dropdown-backdrop") as Element);
    expect(screen.queryByLabelText("goal in minutes")).not.toBeInTheDocument();
    expect(goalLabel()).toBe("0:00 / 10:00");
  });
});

describe("comparison flow", () => {
  const twoVideos = [
    makeVideo({ id: "v1", title: "First Video" }),
    makeVideo({ id: "v2", title: "Second Video" }),
  ];

  test("shows a which-was-harder prompt once a second video has been watched, and submits a vote", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    const { rerender } = render(
      <WatchClient code="es" definition={definition} initialVideos={twoVideos} initialHasMore={false} initialSeed={1} />,
    );

    setSearchParams("video=v2");
    rerender(
      <WatchClient code="es" definition={definition} initialVideos={twoVideos} initialHasMore={false} initialSeed={1} />,
    );

    expect(screen.getByText(/Which video was/)).toBeInTheDocument();
    const compareSection = document.querySelector(".watch-compare-thumbs") as HTMLElement;
    const [firstThumb, secondThumb] = within(compareSection).getAllByRole("button");

    vi.mocked(compareVideos).mockResolvedValue({
      harderVideo: makeVideo({ id: "v1", title: "First Video" }),
      easierVideo: makeVideo({ id: "v2", title: "Second Video" }),
    });

    await user.click(firstThumb);
    expect(compareVideos).toHaveBeenCalledWith("es", "v1", "v2", "session-1");
    await waitFor(() => expect(screen.getByText("Thanks for ranking!")).toBeInTheDocument());
    expect(screen.queryByText(/Which video was/)).not.toBeInTheDocument();

    void secondThumb;
  });

  test("a failed comparison vote shows no confirmation", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    const { rerender } = render(
      <WatchClient code="es" definition={definition} initialVideos={twoVideos} initialHasMore={false} initialSeed={1} />,
    );
    setSearchParams("video=v2");
    rerender(
      <WatchClient code="es" definition={definition} initialVideos={twoVideos} initialHasMore={false} initialSeed={1} />,
    );

    const compareSection = document.querySelector(".watch-compare-thumbs") as HTMLElement;
    const [firstThumb] = within(compareSection).getAllByRole("button");
    vi.mocked(compareVideos).mockResolvedValue(undefined);
    await user.click(firstThumb);
    await waitFor(() => expect(compareVideos).toHaveBeenCalled());
    expect(screen.queryByText("Thanks for ranking!")).not.toBeInTheDocument();
  });

  test("confirmation clears once a different video becomes active", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    const { rerender } = render(
      <WatchClient code="es" definition={definition} initialVideos={twoVideos} initialHasMore={false} initialSeed={1} />,
    );
    setSearchParams("video=v2");
    rerender(
      <WatchClient code="es" definition={definition} initialVideos={twoVideos} initialHasMore={false} initialSeed={1} />,
    );
    const compareSection = document.querySelector(".watch-compare-thumbs") as HTMLElement;
    const [firstThumb] = within(compareSection).getAllByRole("button");
    vi.mocked(compareVideos).mockResolvedValue({
      harderVideo: makeVideo({ id: "v1" }),
      easierVideo: makeVideo({ id: "v2" }),
    });
    await user.click(firstThumb);
    await waitFor(() => expect(screen.getByText("Thanks for ranking!")).toBeInTheDocument());

    setSearchParams("video=v1");
    rerender(
      <WatchClient code="es" definition={definition} initialVideos={twoVideos} initialHasMore={false} initialSeed={1} />,
    );
    expect(screen.queryByText("Thanks for ranking!")).not.toBeInTheDocument();
    await act(async () => {});
  });
});

describe("like / dislike", () => {
  test("liking a video updates the like count and persists it", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    vi.mocked(likeVideo).mockResolvedValue(makeVideo({ id: "v1", likeCount: 3 }));
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", likeCount: 2 })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await user.click(screen.getByRole("button", { name: /2/ }));
    expect(likeVideo).toHaveBeenCalledWith("es", "v1", "session-1");
    await waitFor(() => expect(screen.getByRole("button", { name: /3/ })).toHaveAttribute("aria-pressed", "true"));
    expect(persistLikedIds).toHaveBeenCalledWith(new Set(["v1"]));
    expect(persistDislikedIds).toHaveBeenCalledWith(new Set());
  });

  test("liking a video that was previously disliked clears the dislike", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    vi.mocked(readDislikedIds).mockReturnValue(new Set(["v1"]));
    vi.mocked(likeVideo).mockResolvedValue(makeVideo({ id: "v1", likeCount: 3 }));
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await waitFor(() => expect(screen.getByLabelText("Dislike")).toHaveAttribute("aria-pressed", "true"));
    await user.click(screen.getByRole("button", { name: /2/ }));
    await waitFor(() => expect(screen.getByLabelText("Dislike")).toHaveAttribute("aria-pressed", "false"));
    expect(persistDislikedIds).toHaveBeenCalledWith(new Set());
  });

  test("clicking like again un-likes the video", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    vi.mocked(readLikedIds).mockReturnValue(new Set(["v1"]));
    vi.mocked(likeVideo).mockResolvedValue(makeVideo({ id: "v1", likeCount: 1 }));
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", likeCount: 2 })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await waitFor(() => expect(screen.getByRole("button", { name: /2/ })).toHaveAttribute("aria-pressed", "true"));
    await user.click(screen.getByRole("button", { name: /2/ }));
    await waitFor(() => expect(persistLikedIds).toHaveBeenCalledWith(new Set()));
  });

  test("a failed like leaves state untouched", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    vi.mocked(likeVideo).mockResolvedValue(undefined);
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", likeCount: 2 })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await user.click(screen.getByRole("button", { name: /2/ }));
    await waitFor(() => expect(likeVideo).toHaveBeenCalled());
    expect(persistLikedIds).not.toHaveBeenCalled();
  });

  test("disliking a video updates state, and disliking again un-dislikes it", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    vi.mocked(dislikeVideo).mockResolvedValue(makeVideo({ id: "v1" }));
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await user.click(screen.getByLabelText("Dislike"));
    expect(dislikeVideo).toHaveBeenCalledWith("es", "v1", "session-1");
    await waitFor(() => expect(screen.getByLabelText("Dislike")).toHaveAttribute("aria-pressed", "true"));
    expect(persistDislikedIds).toHaveBeenCalledWith(new Set(["v1"]));

    await user.click(screen.getByLabelText("Dislike"));
    await waitFor(() => expect(persistDislikedIds).toHaveBeenCalledWith(new Set()));
  });

  test("disliking a liked video clears the like", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    vi.mocked(readLikedIds).mockReturnValue(new Set(["v1"]));
    vi.mocked(dislikeVideo).mockResolvedValue(makeVideo({ id: "v1" }));
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1", likeCount: 2 })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await waitFor(() => expect(screen.getByRole("button", { name: /2/ })).toHaveAttribute("aria-pressed", "true"));
    await user.click(screen.getByLabelText("Dislike"));
    await waitFor(() => expect(persistLikedIds).toHaveBeenCalledWith(new Set()));
  });

  test("a second click while a like mutation is in flight is ignored", async () => {
    setSearchParams("video=v1");
    let resolveLike: (video: Video | undefined) => void = () => {};
    vi.mocked(likeVideo).mockImplementation(
      () => new Promise((resolve) => { resolveLike = resolve; }),
    );
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    const likeButton = screen.getByRole("button", { name: /2/ });
    fireEvent.click(likeButton);
    fireEvent.click(likeButton);
    expect(likeVideo).toHaveBeenCalledTimes(1);
    act(() => resolveLike(makeVideo({ id: "v1", likeCount: 3 })));
    await waitFor(() => expect(screen.getByRole("button", { name: /3/ })).toBeInTheDocument());
  });
});

describe("watch random video", () => {
  test("finds a random video, adds it to the list, and navigates to it", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValue(0);
    setSearchParams("video=v1");
    vi.mocked(fetchVideos).mockResolvedValue({
      items: [makeVideo({ id: "v1" }), makeVideo({ id: "v2", title: "Random Pick" })],
      hasMore: false,
    });
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Watch random video" }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/es/watch?video=v2"));
    vi.restoreAllMocks();
  });

  test("does nothing when every candidate is filtered out", async () => {
    const user = userEvent.setup();
    setSearchParams("video=v1");
    vi.mocked(fetchVideos).mockResolvedValue({ items: [makeVideo({ id: "v1" })], hasMore: false });
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Watch random video" }));
    await waitFor(() => expect(fetchVideos).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("shows a level-specific label when a level filter is active", async () => {
    setSearchParams("video=v1&level=b1");
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(screen.getByRole("button", { name: "Watch random B1 video" })).toBeInTheDocument();
    await act(async () => {});
  });

  test("a second click while already finding a random video is ignored", async () => {
    setSearchParams("video=v1");
    let resolveFetch: (value: { items: Video[]; hasMore: boolean }) => void = () => {};
    vi.mocked(fetchVideos).mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    const button = screen.getByRole("button", { name: "Watch random video" });
    fireEvent.click(button);
    expect(screen.getByText("Finding a video...")).toBeInTheDocument();
    fireEvent.click(button);
    expect(fetchVideos).toHaveBeenCalledTimes(1);
    act(() => resolveFetch({ items: [], hasMore: false }));
    await waitFor(() => expect(screen.getByText("Watch random video")).toBeInTheDocument());
  });

  test("does nothing if there is no active video", () => {
    render(
      <WatchClient
        code="es"
        definition={definition}
        initialVideos={[makeVideo({ id: "v1" })]}
        initialHasMore={false}
        initialSeed={1}
      />,
    );
    expect(screen.queryByRole("button", { name: "Watch random video" })).not.toBeInTheDocument();
  });
});

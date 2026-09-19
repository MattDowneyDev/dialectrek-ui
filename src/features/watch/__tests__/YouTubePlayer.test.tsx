import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import YouTubePlayer from "../YouTubePlayer";
import { CONSENT_CHANGED_EVENT, getStoredConsent } from "../../../lib/consent";

vi.mock("../../../lib/consent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/consent")>();
  return { ...actual, getStoredConsent: vi.fn(() => null) };
});

class MockPlayer {
  static instances: MockPlayer[] = [];
  destroy = vi.fn();
  constructor(
    public element: HTMLElement,
    public options: Record<string, unknown>,
  ) {
    MockPlayer.instances.push(this);
  }
}

beforeEach(() => {
  MockPlayer.instances = [];
  window.YT = { Player: MockPlayer } as unknown as typeof YT;
  window.onYouTubeIframeAPIReady = undefined;
  document.head.innerHTML = "";
  vi.mocked(getStoredConsent).mockReturnValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("without consent", () => {
  test("shows a click-to-load placeholder instead of the player", () => {
    render(<YouTubePlayer videoId="abc123" />);
    expect(
      screen.getByText(/This video is hosted by YouTube/),
    ).toBeInTheDocument();
    expect(MockPlayer.instances).toHaveLength(0);
  });

  test("the placeholder thumbnail points at the given video id", () => {
    const { container } = render(<YouTubePlayer videoId="abc123" />);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.src).toContain("https://i.ytimg.com/vi/abc123/hqdefault.jpg");
  });

  test("clicking the placeholder loads the player for just this video", async () => {
    const user = userEvent.setup();
    render(<YouTubePlayer videoId="abc123" />);
    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(MockPlayer.instances).toHaveLength(1));
    expect(MockPlayer.instances[0].options).toMatchObject({
      host: "https://www.youtube-nocookie.com",
      videoId: "abc123",
      playerVars: { rel: 0 },
    });
  });

  test("switching videos after a manual load shows the placeholder again", async () => {
    const user = userEvent.setup();
    const { rerender, container } = render(<YouTubePlayer videoId="abc123" />);
    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(MockPlayer.instances).toHaveLength(1));

    rerender(<YouTubePlayer videoId="xyz789" />);
    expect(
      screen.getByText(/This video is hosted by YouTube/),
    ).toBeInTheDocument();
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.src).toContain("xyz789");
  });

  test("reacts to a consent-changed event fired elsewhere on the page", async () => {
    render(<YouTubePlayer videoId="abc123" />);
    expect(screen.getByText(/This video is hosted by YouTube/)).toBeInTheDocument();

    vi.mocked(getStoredConsent).mockReturnValue("granted");
    act(() => {
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT));
    });

    await waitFor(() => expect(MockPlayer.instances).toHaveLength(1));
    expect(screen.queryByText(/This video is hosted by YouTube/)).not.toBeInTheDocument();
  });
});

describe("with consent already granted", () => {
  beforeEach(() => {
    vi.mocked(getStoredConsent).mockReturnValue("granted");
  });

  test("renders the player wrapper immediately, no placeholder", async () => {
    const { container } = render(<YouTubePlayer videoId="abc123" />);
    expect(screen.queryByText(/This video is hosted by YouTube/)).not.toBeInTheDocument();
    expect(container.querySelector(".watch-player-embed")).toBeInTheDocument();
    await waitFor(() => expect(MockPlayer.instances).toHaveLength(1));
  });

  test("destroys the player on unmount", async () => {
    const { unmount } = render(<YouTubePlayer videoId="abc123" />);
    await waitFor(() => expect(MockPlayer.instances).toHaveLength(1));
    const instance = MockPlayer.instances[0];
    unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });
});

describe("YouTube API script loading", () => {
  // These two run first (in this order) so the module-level apiPromise
  // singleton in YouTubePlayer.tsx is still unset when they start -- once
  // any test resolves it, it stays resolved for the rest of this file.

  test("a second player mounted while the API is still loading reuses the same pending load and chains any pre-existing callback", async () => {
    window.YT = undefined as unknown as typeof YT;
    const preExistingCallback = vi.fn();
    window.onYouTubeIframeAPIReady = preExistingCallback;
    vi.mocked(getStoredConsent).mockReturnValue("granted");

    render(<YouTubePlayer videoId="video-a" />);
    render(<YouTubePlayer videoId="video-b" />);

    expect(document.head.querySelectorAll("script[src*='iframe_api']")).toHaveLength(1);

    window.YT = { Player: MockPlayer } as unknown as typeof YT;
    window.onYouTubeIframeAPIReady?.();
    await waitFor(() => expect(MockPlayer.instances).toHaveLength(2));
    expect(preExistingCallback).toHaveBeenCalledTimes(1);
  });

  test("does not construct a player if unmounted before the API script finishes loading", async () => {
    // Leave window.YT unset so loadYouTubeApi takes the script-injection
    // path instead of the already-loaded fast path.
    window.YT = undefined as unknown as typeof YT;
    vi.mocked(getStoredConsent).mockReturnValue("granted");

    const { unmount } = render(<YouTubePlayer videoId="abc123" />);

    unmount();

    window.YT = { Player: MockPlayer } as unknown as typeof YT;
    window.onYouTubeIframeAPIReady?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(MockPlayer.instances).toHaveLength(0);
  });
});

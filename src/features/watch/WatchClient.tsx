"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import type { LanguageDefinition } from "../../languages/registry";
import { compareVideos, dislikeVideo, fetchVideos, likeVideo } from "./api";
import CompareThumb from "./CompareThumb";
import DifficultyBadge from "./DifficultyBadge";
import {
  ChevronDownIcon,
  PlayIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "./icons";
import {
  getSessionId,
  persistDislikedIds,
  persistLikedIds,
  readDislikedIds,
  readLikedIds,
} from "./session";
import {
  formatDuration,
  isDifficultyLevel,
  isSortMode,
  levelLabel,
  type DifficultyLevel,
  type SortMode,
  type Video,
} from "./types";
import VideoCard from "./VideoCard";
import WatchIntroModal from "./WatchIntroModal";
import YouTubePlayer from "./YouTubePlayer";

type WatchClientProps = {
  code: string;
  definition: LanguageDefinition;
  // The first page of videos, fetched server-side in page.tsx for whatever
  // filter/sort the URL asked for -- lets the grid ship with real content
  // in the initial HTML instead of an empty shell that only fills in once
  // the client re-fetches, which crawlers that don't run JS never see.
  initialVideos?: Video[];
  initialHasMore?: boolean;
  initialSeed?: number;
  // The video named by the URL's ?video= param, fetched by id server-side
  // since it won't generally be in initialVideos (that's just a page of the
  // browse grid, matching the current filter/sort, not this one video).
  initialActiveVideo?: Video;
};

const WatchClient = ({
  code,
  definition,
  initialVideos,
  initialHasMore,
  initialSeed,
  initialActiveVideo,
}: WatchClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasInitialData = initialVideos !== undefined;

  // Merged in up front, the same way watchRandomVideo below merges its pick
  // into videos so the activeVideo lookup finds it -- this is what lets a
  // hard refresh (or opening a shared link) land straight on the right
  // video instead of falling back to the browse grid.
  const [videos, setVideos] = useState<Video[]>(() => {
    const base = initialVideos ?? [];
    if (initialActiveVideo && !base.some((video) => video.id === initialActiveVideo.id)) {
      return [...base, initialActiveVideo];
    }
    return base;
  });
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore ?? false);
  const [isMutating, setIsMutating] = useState(false);
  // One random seed per browsing session (new filters, new sort, fresh
  // page load), reused across every "load more" page so sort=random stays
  // a stable order while paging through it instead of reshuffling per page.
  const seedRef = useRef(initialSeed ?? 0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [lastWatchedId, setLastWatchedId] = useState<string | null>(null);
  const [trackedVideoId, setTrackedVideoId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isFindingRandom, setIsFindingRandom] = useState(false);

  // Filter, sort, and which video is open all live in the URL rather than
  // component state -- that's what makes the browser's back button land
  // the user back on the watch tab with their filters intact instead of
  // leaving the page entirely.
  const activeVideoId = searchParams.get("video");
  const rawLevel = searchParams.get("level");
  const filterLevel: DifficultyLevel | "all" = isDifficultyLevel(rawLevel)
    ? rawLevel
    : "all";
  const rawSort = searchParams.get("sort");
  const sortMode: SortMode = isSortMode(rawSort) ? rawSort : "random";
  const randomVideoLabel =
    filterLevel === "all"
      ? "Watch random video"
      : `Watch random ${levelLabel[filterLevel]} video`;

  // Clears any leftover confirmation whenever the video in the URL changes
  // -- including when it's cleared by the back button -- so a stale
  // "thanks, ranking updated" message from the last video never lingers.
  useEffect(() => {
    setConfirmation(null);
  }, [activeVideoId]);

  // Picks up whatever this browser already liked/disliked in a previous
  // visit -- without this, likedIds/dislikedIds start empty on every reload
  // even though the backend still remembers the vote against this session
  // id, so the button would show as un-toggled and then flip the vote the
  // wrong way on the next click.
  useEffect(() => {
    setLikedIds(readLikedIds());
    setDislikedIds(readDislikedIds());
  }, []);

  // Tracks which (code, level, sort) combo `videos` currently holds data
  // for. The server already fetched a page matching the URL's filters on
  // this load, so the effect below compares against this rather than using
  // a one-shot "skip the first run" flag -- a flag like that gets consumed
  // by React Strict Mode's extra mount-time effect replay in dev before the
  // "real" run ever sees it, wiping out the SSR data and re-fetching (and
  // reshuffling, for sort=random) a page that may no longer include
  // whatever video is currently open. Comparing against the actual params
  // already loaded is safe to check any number of times.
  const loadedParamsKey = `${code}|${filterLevel}|${sortMode}`;
  const loadedParamsRef = useRef(hasInitialData ? loadedParamsKey : null);

  // Filtering and sorting happen server-side now (see watch.py). A new
  // seed here means a fresh shuffle for sort=random each time the filters
  // actually change, while "load more" below keeps reusing this same seed.
  useEffect(() => {
    if (loadedParamsRef.current === loadedParamsKey) return;
    loadedParamsRef.current = loadedParamsKey;

    let cancelled = false;
    seedRef.current = Math.floor(Math.random() * 1_000_000_000);
    setIsLoading(true);
    setVideos([]);
    fetchVideos(code, {
      level: filterLevel === "all" ? undefined : filterLevel,
      sort: sortMode,
      seed: seedRef.current,
    }).then((result) => {
      if (cancelled) return;
      setVideos(result.items);
      setHasMore(result.hasMore);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [code, filterLevel, sortMode]);

  // Kept in a ref (rather than depended on directly) so the
  // IntersectionObserver effect below can set itself up once per browse
  // session instead of tearing down and reconnecting on every state change.
  const loadMoreRef = useRef<() => void>(() => {});
  loadMoreRef.current = () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    fetchVideos(code, {
      level: filterLevel === "all" ? undefined : filterLevel,
      sort: sortMode,
      seed: seedRef.current,
      offset: videos.length,
    }).then((result) => {
      setVideos((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setIsLoadingMore(false);
    });
  };

  // The sentinel div only exists in the DOM once loading finishes and the
  // grid actually renders (it's absent while isLoading is true and while
  // watching a video) -- depending on that, not just activeVideoId, is
  // what lets this find the real node instead of running once against a
  // still-null ref and never re-attaching.
  const showGrid = !isLoading && videos.length > 0;
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeVideoId, showGrid]);

  const updateParams = (
    updates: Record<string, string | null>,
    push: boolean,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (push) {
      router.push(url);
    } else {
      router.replace(url);
    }
  };

  // Whichever video was active just before this one automatically becomes
  // the baseline for comparison -- watching a video is what sets up the
  // "compared to X" box for the next one, no explicit opt-in needed. There's
  // no baseline yet for the very first video of the session, so the box
  // shows a placeholder prompting one more video instead of the compare
  // buttons until there's a second video to compare it to.
  if (activeVideoId !== trackedVideoId) {
    if (trackedVideoId) setLastWatchedId(trackedVideoId);
    setTrackedVideoId(activeVideoId);
  }

  const activeVideo =
    videos.find((video) => video.id === activeVideoId) ?? null;
  const lastVideo =
    lastWatchedId && lastWatchedId !== activeVideoId
      ? (videos.find((video) => video.id === lastWatchedId) ?? null)
      : null;

  const visibleVideos = videos;

  // Pushed (not replaced) so it lands as a new history entry -- that's
  // what lets the browser back button pop back to the browse view.
  const openVideo = (id: string) => updateParams({ video: id }, true);

  // Always lands on the grid, no matter how many videos deep the history
  // stack is (e.g. several "watch random video" clicks in a row) -- unlike
  // the browser's own back button, which steps through that history one
  // video at a time, this button's job is to always mean "take me to the
  // grid" in one click.
  const backToBrowse = () => updateParams({ video: null }, true);

  // Fetches a fresh, freshly-shuffled page for the current level filter
  // rather than picking from `videos` (which is just whatever's been
  // paged into the browse grid so far), so this can land on a video the
  // user hasn't loaded into the grid at all. Added to `videos` on the way
  // in so the player lookup below finds it.
  const watchRandomVideo = async () => {
    if (!activeVideo || isFindingRandom) return;
    setIsFindingRandom(true);
    const result = await fetchVideos(code, {
      level: filterLevel === "all" ? undefined : filterLevel,
      sort: "random",
      seed: Math.floor(Math.random() * 1_000_000_000),
    });
    const candidates = result.items.filter(
      (video) => video.id !== activeVideo.id,
    );
    setIsFindingRandom(false);
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setVideos((prev) =>
      prev.some((video) => video.id === pick.id) ? prev : [...prev, pick],
    );
    // Pushed, same as picking a video from the grid -- the back button
    // should step through watch history one video at a time (this random
    // video, then whatever was playing before it, and so on) before
    // finally landing back on the browse grid.
    openVideo(pick.id);
  };

  const toggleLike = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    const updated = await likeVideo(code, id, getSessionId());
    if (updated) {
      setVideos((prev) =>
        prev.map((video) => (video.id === id ? updated : video)),
      );
      // A video can only be liked or disliked at once -- liking always
      // clears any standing dislike, mirroring the backend's toggle.
      const nextDisliked = new Set(dislikedIds);
      nextDisliked.delete(id);
      setDislikedIds(nextDisliked);
      persistDislikedIds(nextDisliked);

      const nextLiked = new Set(likedIds);
      if (nextLiked.has(id)) {
        nextLiked.delete(id);
      } else {
        nextLiked.add(id);
      }
      setLikedIds(nextLiked);
      persistLikedIds(nextLiked);
    }
    setIsMutating(false);
  };

  const toggleDislike = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    const updated = await dislikeVideo(code, id, getSessionId());
    if (updated) {
      setVideos((prev) =>
        prev.map((video) => (video.id === id ? updated : video)),
      );
      const nextLiked = new Set(likedIds);
      nextLiked.delete(id);
      setLikedIds(nextLiked);
      persistLikedIds(nextLiked);

      const nextDisliked = new Set(dislikedIds);
      if (nextDisliked.has(id)) {
        nextDisliked.delete(id);
      } else {
        nextDisliked.add(id);
      }
      setDislikedIds(nextDisliked);
      persistDislikedIds(nextDisliked);
    }
    setIsMutating(false);
  };

  const castComparisonVote = async (harderId: string, easierId: string) => {
    if (!activeVideo || !lastVideo || isMutating) return;
    setIsMutating(true);

    const result = await compareVideos(
      code,
      harderId,
      easierId,
      getSessionId(),
    );
    if (result) {
      setVideos((prev) =>
        prev.map((video) => {
          if (video.id === result.harderVideo.id) return result.harderVideo;
          if (video.id === result.easierVideo.id) return result.easierVideo;
          return video;
        }),
      );
      setConfirmation("Thanks for ranking!");
    }
    setIsMutating(false);
  };

  return (
    <div className="page">
      <WatchIntroModal />
      {activeVideo ? (
        <>
          <PageHeader
            title={activeVideo.title}
            subtitle={`${activeVideo.channel} · ${formatDuration(activeVideo.durationSeconds)}`}
            backTo={{ onClick: backToBrowse, label: "← All videos" }}
            compact
          />

          <div className="watch-player">
            <div className="watch-player-frame">
              {/* Guards against a row with no real video behind it (a
                  "placeholder-*" id) -- falls back to the static icon instead
                  of asking YouTube to embed a video that doesn't exist. */}
              {activeVideo.youtubeId.startsWith("placeholder-") ? (
                <PlayIcon />
              ) : (
                <YouTubePlayer videoId={activeVideo.youtubeId} />
              )}
            </div>

            <div className="watch-player-info">
              <div className="watch-vote-buttons">
                <button
                  type="button"
                  className={`watch-like-button${likedIds.has(activeVideo.id) ? " liked" : ""}`}
                  onClick={() => toggleLike(activeVideo.id)}
                  aria-pressed={likedIds.has(activeVideo.id)}
                  disabled={isMutating}
                >
                  <ThumbsUpIcon filled={likedIds.has(activeVideo.id)} />
                  {activeVideo.likeCount}
                </button>
                <button
                  type="button"
                  className={`watch-dislike-button${dislikedIds.has(activeVideo.id) ? " disliked" : ""}`}
                  onClick={() => toggleDislike(activeVideo.id)}
                  aria-pressed={dislikedIds.has(activeVideo.id)}
                  aria-label="Dislike"
                  disabled={isMutating}
                >
                  <ThumbsDownIcon filled={dislikedIds.has(activeVideo.id)} />
                </button>
              </div>
              <DifficultyBadge score={activeVideo.difficultyScore} />
            </div>

            <div className="watch-random-row">
              <Button
                variant="outline"
                onClick={watchRandomVideo}
                disabled={isFindingRandom}
              >
                {isFindingRandom ? "Finding a video..." : randomVideoLabel}
              </Button>
            </div>

            {!confirmation &&
              (lastVideo ? (
                <div className="watch-compare">
                  <p>
                    Which video was{" "}
                    <span className="watch-compare-emphasis">harder</span>?
                  </p>
                  <div className="watch-compare-thumbs">
                    <CompareThumb
                      video={lastVideo}
                      onSelect={() =>
                        castComparisonVote(lastVideo.id, activeVideo.id)
                      }
                      disabled={isMutating}
                    />
                    <span className="watch-compare-vs">vs</span>
                    <CompareThumb
                      video={activeVideo}
                      onSelect={() =>
                        castComparisonVote(activeVideo.id, lastVideo.id)
                      }
                      disabled={isMutating}
                    />
                  </div>
                </div>
              ) : (
                <div className="watch-compare">
                  <p>Watch at least one more video to start ranking.</p>
                </div>
              ))}

            {confirmation && (
              <div className="watch-compare">
                <p>{confirmation}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <PageHeader
            title="Watch"
            subtitle={`Comprehensible input from native ${definition.displayName} speakers on YouTube, sorted by level so you always understand enough to follow along.`}
          />

          <div className="watch-toolbar">
            <div className="watch-filters">
              <div className="watch-select-wrap">
                <select
                  className="watch-select"
                  value={filterLevel}
                  onChange={(event) =>
                    updateParams(
                      {
                        level:
                          event.target.value === "all"
                            ? null
                            : event.target.value,
                      },
                      false,
                    )
                  }
                  aria-label="Filter by level"
                >
                  <option value="all">All levels</option>
                  {(["a1", "a2", "b1", "b2", "c1", "c2"] as const).map(
                    (level) => (
                      <option key={level} value={level}>
                        {levelLabel[level]}
                      </option>
                    ),
                  )}
                </select>
                <span className="watch-select-chevron">
                  <ChevronDownIcon />
                </span>
              </div>

              <div className="watch-select-wrap">
                <select
                  className="watch-select"
                  value={sortMode}
                  onChange={(event) =>
                    updateParams(
                      {
                        sort:
                          event.target.value === "random"
                            ? null
                            : event.target.value,
                      },
                      false,
                    )
                  }
                  aria-label="Sort videos"
                >
                  <option value="random">Random</option>
                  <option value="easiest">Easiest first</option>
                  <option value="hardest">Hardest first</option>
                  <option value="most-liked">Most liked</option>
                </select>
                <span className="watch-select-chevron">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <EmptyState>Loading videos...</EmptyState>
          ) : visibleVideos.length === 0 ? (
            <EmptyState>
              No videos at this level yet. Try a different filter.
            </EmptyState>
          ) : (
            <>
              <div className="watch-grid">
                {visibleVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onSelect={openVideo}
                  />
                ))}
              </div>
              {/* Scrolling this into view triggers the next page -- see the
                  IntersectionObserver effect above. Stays mounted even once
                  hasMore is false; loadMoreRef is a no-op in that case. */}
              <div
                ref={sentinelRef}
                className="watch-load-sentinel"
                aria-hidden="true"
              />
              {isLoadingMore && <EmptyState>Loading more...</EmptyState>}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default WatchClient;

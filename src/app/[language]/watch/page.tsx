import type { Metadata } from "next";
import { Suspense } from "react";
import ComingSoon from "../../../components/ComingSoon";
import { fetchVideo, fetchVideos } from "../../../features/watch/api";
import { isDifficultyLevel, isSortMode } from "../../../features/watch/types";
import WatchClient from "../../../features/watch/WatchClient";
import { LANGUAGES } from "../../../languages/registry";
import { pageMetadata } from "../../../lib/seo";

type PageProps = {
  params: Promise<{ language: string }>;
  searchParams: Promise<{ level?: string; sort?: string; video?: string }>;
};

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { language } = await params;
  const definition = LANGUAGES[language];
  if (!definition) return {};
  return pageMetadata({
    title: `${definition.displayName} Comprehensible Input Videos`,
    description: definition.hasWatch
      ? `Comprehensible input videos in ${definition.displayName} -- real native speakers on YouTube, sorted by difficulty so you always understand enough to follow along.`
      : `${definition.displayName} comprehensible input videos are coming soon.`,
    path: `/${language}/watch`,
  });
};

const WatchPage = async ({ params, searchParams }: PageProps) => {
  const { language } = await params;
  const definition = LANGUAGES[language];
  if (!definition) return null;
  if (!definition.hasWatch) {
    return <ComingSoon title="Watch" language={language} definition={definition} />;
  }

  // Fetches the first page server-side, matching whatever filter/sort the
  // URL asked for, so the grid ships with real video titles and links in
  // the initial HTML -- crawlers and link previews that don't run JS would
  // otherwise only ever see the "Loading videos..." placeholder.
  const { level: rawLevel, sort: rawSort, video: videoId } = await searchParams;
  const level = isDifficultyLevel(rawLevel) ? rawLevel : undefined;
  const sort = isSortMode(rawSort) ? rawSort : "random";
  const seed = Math.floor(Math.random() * 1_000_000_000);
  const [initial, initialActiveVideo] = await Promise.all([
    fetchVideos(definition.code, { level, sort, seed }),
    // The grid fetch above is just whatever page matches the current
    // filter/sort -- the video someone's mid-refresh on on won't generally
    // be in it, so it's fetched by id directly and merged in by WatchClient.
    // Without this, opening a video link fresh (including a plain reload)
    // never finds it and falls back to the browse grid instead.
    videoId ? fetchVideo(definition.code, videoId) : Promise.resolve(undefined),
  ]);

  // If the server-side fetch above never actually succeeded (e.g. a cold
  // Lambda timing out), don't bake that in as a legitimate empty page --
  // leaving initialVideos undefined tells WatchClient it hasn't loaded yet,
  // so it fetches client-side instead of showing "no videos" forever.
  return (
    <Suspense fallback={null}>
      <WatchClient
        code={definition.code}
        definition={definition}
        initialVideos={initial.error ? undefined : initial.items}
        initialHasMore={initial.error ? undefined : initial.hasMore}
        initialSeed={seed}
        initialActiveVideo={initialActiveVideo}
      />
    </Suspense>
  );
};

export default WatchPage;

import axios from "axios";
import { BASE_URL } from "../../languages/api";
import type { DifficultyLevel, SortMode, Video } from "./types";

type ApiVideo = {
  id: string;
  youtube_id: string;
  title: string;
  channel: string;
  duration_seconds: number;
  difficulty_score: number;
  like_count: number;
};

const toVideo = (video: ApiVideo): Video => ({
  id: video.id,
  youtubeId: video.youtube_id,
  title: video.title,
  channel: video.channel,
  durationSeconds: video.duration_seconds,
  difficultyScore: video.difficulty_score,
  likeCount: video.like_count,
});

export const PAGE_SIZE = 24;

// `error: true` means the request never actually succeeded, as opposed to
// succeeding with a genuinely empty page -- callers need to tell those two
// apart so a cold-starting Lambda doesn't get reported to the user as "no
// videos at this level".
type VideoPage = { items: Video[]; hasMore: boolean; error?: boolean };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A Lambda that's been idle can time out or 5xx on the very first request
// after a cold start -- a couple of quick retries usually land on a warm
// instance instead of surfacing that as an empty result.
const RETRY_DELAYS_MS = [400, 1200];

export const fetchVideos = async (
  language: string,
  options: { level?: DifficultyLevel; sort?: SortMode; seed?: number; offset?: number } = {},
): Promise<VideoPage> => {
  const params = {
    level: options.level,
    sort: options.sort,
    seed: options.seed,
    offset: options.offset ?? 0,
    limit: PAGE_SIZE,
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await axios.get<{ items: ApiVideo[]; has_more: boolean }>(
        `${BASE_URL}/${language}/videos`,
        { params },
      );
      return { items: response.data.items.map(toVideo), hasMore: response.data.has_more };
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length) {
        console.error("error fetching videos:", error);
        return { items: [], hasMore: false, error: true };
      }
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
};

export const fetchVideo = async (
  language: string,
  videoId: string,
): Promise<Video | undefined> => {
  try {
    const response = await axios.get<ApiVideo>(`${BASE_URL}/${language}/videos/${videoId}`);
    return toVideo(response.data);
  } catch (error) {
    console.error("error fetching video:", error);
    return undefined;
  }
};

export const fetchRelatedVideos = async (
  language: string,
  videoId: string,
): Promise<Video[]> => {
  try {
    const response = await axios.get<ApiVideo[]>(
      `${BASE_URL}/${language}/videos/${videoId}/related`,
    );
    return response.data.map(toVideo);
  } catch (error) {
    console.error("error fetching related videos:", error);
    return [];
  }
};

export const likeVideo = async (
  language: string,
  videoId: string,
  sessionId: string,
): Promise<Video | undefined> => {
  try {
    const response = await axios.post<ApiVideo>(`${BASE_URL}/${language}/videos/${videoId}/like`, {
      session_id: sessionId,
    });
    return toVideo(response.data);
  } catch (error) {
    console.error("error liking video:", error);
    return undefined;
  }
};

export const dislikeVideo = async (
  language: string,
  videoId: string,
  sessionId: string,
): Promise<Video | undefined> => {
  try {
    const response = await axios.post<ApiVideo>(`${BASE_URL}/${language}/videos/${videoId}/dislike`, {
      session_id: sessionId,
    });
    return toVideo(response.data);
  } catch (error) {
    console.error("error disliking video:", error);
    return undefined;
  }
};

export const compareVideos = async (
  language: string,
  harderVideoId: string,
  easierVideoId: string,
  sessionId: string,
): Promise<{ harderVideo: Video; easierVideo: Video } | undefined> => {
  try {
    const response = await axios.post<{ harder_video: ApiVideo; easier_video: ApiVideo }>(
      `${BASE_URL}/${language}/videos/${harderVideoId}/compare`,
      { easier_video_id: easierVideoId, session_id: sessionId },
    );
    return { harderVideo: toVideo(response.data.harder_video), easierVideo: toVideo(response.data.easier_video) };
  } catch (error) {
    console.error("error submitting comparison:", error);
    return undefined;
  }
};

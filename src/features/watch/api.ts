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

type VideoPage = { items: Video[]; hasMore: boolean };

export const fetchVideos = async (
  language: string,
  options: { level?: DifficultyLevel; sort?: SortMode; seed?: number; offset?: number } = {},
): Promise<VideoPage> => {
  try {
    const response = await axios.get<{ items: ApiVideo[]; has_more: boolean }>(
      `${BASE_URL}/${language}/videos`,
      {
        params: {
          level: options.level,
          sort: options.sort,
          seed: options.seed,
          offset: options.offset ?? 0,
          limit: PAGE_SIZE,
        },
      },
    );
    return { items: response.data.items.map(toVideo), hasMore: response.data.has_more };
  } catch (error) {
    console.error("error fetching videos:", error);
    return { items: [], hasMore: false };
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

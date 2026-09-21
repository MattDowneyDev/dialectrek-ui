import { useState } from "react";
import DifficultyBadge from "./DifficultyBadge";
import { PlayIcon, ThumbsUpIcon } from "./icons";
import { formatDuration } from "../../lib/duration";
import type { Video } from "./types";

type VideoCardProps = {
  video: Video;
  onSelect: (id: string) => void;
};

const VideoCard = ({ video, onSelect }: VideoCardProps) => {
  // Guards against a row with no real video behind it (a "placeholder-*"
  // youtube_id) -- there's no real thumbnail to fetch for those, so they
  // keep the plain gradient box instead of asking YouTube's thumbnail CDN
  // for an image that doesn't exist.
  const hasRealThumbnail = !video.youtubeId.startsWith("placeholder-");
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  return (
    <button type="button" className="watch-card" onClick={() => onSelect(video.id)}>
      <div className="watch-card-thumb">
        {hasRealThumbnail && !thumbnailFailed && (
          <img
            className="watch-card-thumb-image"
            src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            onError={() => setThumbnailFailed(true)}
          />
        )}
        <span className="watch-card-play">
          <PlayIcon />
        </span>
        <span className="watch-card-duration">{formatDuration(video.durationSeconds)}</span>
      </div>
      <div className="watch-card-body">
        <h3>{video.title}</h3>
        <p className="watch-card-channel">{video.channel}</p>
        <div className="watch-card-meta">
          <DifficultyBadge score={video.difficultyScore} />
          <span className="watch-card-likes">
            <ThumbsUpIcon filled={false} />
            {video.likeCount}
          </span>
        </div>
      </div>
    </button>
  );
};

export default VideoCard;

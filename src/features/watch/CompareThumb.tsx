import { useState } from "react";
import { PlayIcon } from "./icons";
import type { Video } from "./types";

type CompareThumbProps = {
  video: Video;
  onSelect: () => void;
  disabled: boolean;
};

// Same thumbnail-with-fallback logic as VideoCard, just wired to pick a
// video as "harder" on click instead of opening it.
const CompareThumb = ({ video, onSelect, disabled }: CompareThumbProps) => {
  const hasRealThumbnail = !video.youtubeId.startsWith("placeholder-");
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  return (
    <button type="button" className="watch-compare-thumb" onClick={onSelect} disabled={disabled}>
      <span className="watch-compare-thumb-image">
        {hasRealThumbnail && !thumbnailFailed ? (
          <img
            src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <PlayIcon />
        )}
      </span>
      <span className="watch-compare-thumb-title">{video.title}</span>
    </button>
  );
};

export default CompareThumb;

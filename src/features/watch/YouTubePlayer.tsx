"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONSENT_CHANGED_EVENT,
  getStoredConsent,
} from "../../lib/consent";
import { PlayIcon } from "./icons";

// @types/youtube declares the YT namespace but not the API's own callback
// global, which it invokes directly on window once the script loads.
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayerProps = {
  videoId: string;
  onPlayerStateChange?: (state: YT.PlayerState) => void;
};

// The official way to embed -- see
// https://developers.google.com/youtube/iframe_api_reference. The script is
// shared across every player on the page and only ever injected once.
let apiPromise: Promise<typeof YT> | null = null;

const loadYouTubeApi = (): Promise<typeof YT> => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return apiPromise;
};

const YouTubePlayer = ({ videoId, onPlayerStateChange }: YouTubePlayerProps) => {
  // The YouTube API doesn't render inside the element it's given -- it
  // replaces that element with its iframe. So this ref stays on a wrapper
  // React always owns, and the API gets a plain div created outside React's
  // tree to swap out; otherwise React tries to remove a node YouTube already
  // replaced on unmount and throws a removeChild error.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  // Kept in a ref so the player-creation effect below doesn't need to
  // depend on it -- a new callback identity on every parent render would
  // otherwise tear down and recreate the whole embedded player.
  const onPlayerStateChangeRef = useRef(onPlayerStateChange);
  onPlayerStateChangeRef.current = onPlayerStateChange;

  // Loading YouTube's player sets cookies from Google beyond what's needed
  // to render video, so it waits for the same cookie consent the analytics
  // banner asks for. Declining doesn't block playback outright -- clicking
  // the placeholder below counts as that visitor's own explicit request to
  // load this one video, which is the standard compliant pattern for sites
  // built around embedded video.
  const [consented, setConsented] = useState(() => getStoredConsent() === "granted");
  const [manuallyLoaded, setManuallyLoaded] = useState(false);
  const shouldLoad = consented || manuallyLoaded;

  useEffect(() => {
    const onConsentChange = () => setConsented(getStoredConsent() === "granted");
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
  }, []);

  // A manual click only ever grants that one video -- switching to another
  // video without consent must show its own placeholder again.
  useEffect(() => {
    setManuallyLoaded(false);
  }, [videoId]);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;
    const target = document.createElement("div");
    wrapperRef.current?.appendChild(target);

    loadYouTubeApi().then((YTApi) => {
      if (cancelled) return;
      playerRef.current = new YTApi.Player(target, {
        // The privacy-enhanced domain -- YouTube's own mitigation for
        // exactly this concern, on top of gating the load behind consent.
        host: "https://www.youtube-nocookie.com",
        videoId,
        width: "100%",
        height: "100%",
        // rel=0 limits related videos (shown after playback ends) to the
        // same channel rather than the whole site -- YouTube stopped
        // supporting fully disabling them in 2018, but this is still
        // respected. Nothing here hides the player chrome or YouTube
        // branding, which their embed terms require.
        playerVars: { rel: 0 },
        events: {
          onStateChange: (event) => onPlayerStateChangeRef.current?.(event.data),
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, shouldLoad]);

  if (!shouldLoad) {
    return (
      <button
        type="button"
        className="watch-player-embed watch-player-placeholder"
        onClick={() => setManuallyLoaded(true)}
      >
        <img
          className="watch-player-placeholder-thumb"
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
        />
        <span className="watch-player-placeholder-icon">
          <PlayIcon />
        </span>
        <span className="watch-player-placeholder-text">
          This video is hosted by YouTube. Click to load it and accept
          YouTube&apos;s cookies.
        </span>
      </button>
    );
  }

  return <div className="watch-player-embed" ref={wrapperRef} />;
};

export default YouTubePlayer;

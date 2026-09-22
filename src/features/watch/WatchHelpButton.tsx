"use client";

import { useState } from "react";
import { InfoIcon } from "./icons";
import RankingSeesawGraphic from "./RankingSeesawGraphic";
import WatchHelpModal from "./WatchHelpModal";

// A standalone, on-demand explainer of the ranking mechanism -- distinct
// from (and independent of) WatchIntroModal's daily reminder. Opening or
// closing this has no effect on that popup's own daily-seen state.
const WatchHelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="watch-help-trigger"
        onClick={() => setIsOpen(true)}
      >
        <InfoIcon />
        How rankings work
      </button>
      {isOpen && (
        <WatchHelpModal
          title="How Rankings Work"
          onClose={() => setIsOpen(false)}
        >
          <div className="watch-help-graphic">
            <RankingSeesawGraphic />
          </div>
          <p>
            New videos are imported with a "best guess" difficulty score. After
            watching multiple videos, you choose which was more difficult to
            understand.
          </p>
          <p>
            Ranking a video as more difficult makes its difficulty score go up
            while the one it was compared to goes down. With enough rankings,
            each video will settle into its home within the difficulty rankings.
          </p>
          <p>
            If you're feeling adventurous, watching random videos instead of
            videos sorted by difficulty helps this process immensely.
          </p>
        </WatchHelpModal>
      )}
    </>
  );
};

export default WatchHelpButton;

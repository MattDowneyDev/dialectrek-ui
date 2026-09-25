"use client";

import { useState } from "react";
import Accordion, { type AccordionItem } from "../../components/Accordion";
import { InfoIcon } from "./icons";
import WatchHelpModal from "./WatchHelpModal";

const HELP_SECTIONS: AccordionItem[] = [
  {
    id: "how-to-use",
    title: "How to use",
    content: (
      <>
        <p>1. Choose a difficulty level appropriate for you.</p>
        <p>
          2. Choose any video to watch and it will open in the Watch screen.
        </p>
        <p>3. Be sure to rank and like/dislike videos that you watch.</p>
        <p>
          4. Use the "Watch random video" button to get another video in the
          difficulty range that you've chosen.
        </p>
      </>
    ),
  },
  {
    id: "ranking",
    title: "Ranking",
    content: (
      <>
        <p>
          New videos are imported with a "best guess" difficulty score. Usually
          these best guesses are accurate. Sometime they're not.
        </p>
        <p>
          User ranking helps makes this as accurate as possible. With enough
          rankings, videos end up exactly where they should be.
        </p>
      </>
    ),
  },
  {
    id: "liking",
    title: "Liking and disliking",
    content: (
      <>
        <p>
          Videos are imported by YouTube channel, not individually. Sometimes
          some duds slip through.
        </p>
        <p>
          Likes tell other users which videos are worth watching. Dislikes tell
          us which videos should be deleted.
        </p>
      </>
    ),
  },
];

// On-demand explainer of how Watch works -- a quick how-to, then ranking
// and liking, one accordion section each.
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
        How Watch works
      </button>
      {isOpen && (
        <WatchHelpModal
          title="How Watch Works"
          onClose={() => setIsOpen(false)}
        >
          <Accordion defaultOpenId="how-to-use" items={HELP_SECTIONS} />
        </WatchHelpModal>
      )}
    </>
  );
};

export default WatchHelpButton;

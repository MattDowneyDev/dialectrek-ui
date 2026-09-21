"use client";

import { useEffect, useState } from "react";
import { hasSeenWatchIntroToday, markWatchIntroSeenToday } from "./session";
import WatchHelpModal from "./WatchHelpModal";

// Onboarding reminder for the Watch tab -- dismissing it only silences it
// for the rest of today, same as the daily goal progress resetting
// overnight (see lib/dailyGoal.ts), rather than never showing again. A
// separate, on-demand popup with a deeper explanation of the ranking
// mechanism lives behind the "How rankings work" button (WatchHelpButton) --
// the two are independent, so dismissing one doesn't affect the other.
const WatchIntroModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenWatchIntroToday()) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const dismiss = () => {
    markWatchIntroSeenToday();
    setIsOpen(false);
  };

  return (
    <WatchHelpModal title="We Need Your Help!" onClose={dismiss}>
      <p>
        This section is new so the difficuly rankings may be innaccurate. Here's
        what you can do:
      </p>
      <p>1. Watch lots of videos.</p>
      <p>2. Rank their difficulty compared to the last video.</p>
      <p>
        That's it! Every ranking makes it more accurate for you and everyone
        else.
      </p>
    </WatchHelpModal>
  );
};

export default WatchIntroModal;

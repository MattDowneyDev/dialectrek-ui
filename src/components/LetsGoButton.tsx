"use client";

import Button from "./Button";

type LetsGoButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

// The confirm button at the bottom of a multi-select picker screen (which
// categories, which tenses, ...) -- shared so every picker screen ends the
// same way instead of each one inventing its own "Let's conjugate!"-style
// label. Wrapped in a sticky footer bar (see .selection-confirm) so it stays
// pinned to the bottom of the viewport while a long card grid scrolls past
// above it, rather than sitting off-screen below the last row until the user
// scrolls all the way down to find it.
const LetsGoButton = ({ disabled, onClick }: LetsGoButtonProps) => (
  <div className="selection-confirm">
    <Button disabled={disabled} onClick={onClick}>
      Let&apos;s go!
    </Button>
  </div>
);

export default LetsGoButton;

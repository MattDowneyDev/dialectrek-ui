"use client";

import Button from "./Button";

type LetsGoButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

// The confirm button at the bottom of a multi-select picker screen (which
// categories, which tenses, ...) -- shared so every picker screen ends the
// same way instead of each one inventing its own "Let's conjugate!"-style
// label.
const LetsGoButton = ({ disabled, onClick }: LetsGoButtonProps) => (
  <Button disabled={disabled} onClick={onClick}>
    Let&apos;s go!
  </Button>
);

export default LetsGoButton;
